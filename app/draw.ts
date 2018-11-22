import regl from "regl";
import _ from "lodash";
import { mat4, vec3 } from "gl-matrix";
import { State, Vec3, Transform } from "../common/interfaces";
const bunny = require("bunny");
const normals = require("angle-normals");

interface Camera {
  position: Vec3;
  rotation: Vec3;
}

//TODO: reconcile this with other Transform type

const degreeToRadian = (d: number) => d * 0.0174533;

const getViewMatrix = (camera: Camera) => {
  let viewMatrix = mat4.create();
  mat4.rotateX(viewMatrix, viewMatrix, degreeToRadian(camera.rotation.x));
  mat4.rotateY(viewMatrix, viewMatrix, degreeToRadian(camera.rotation.y));

  let translation = vec3.create();
  vec3.set(
    translation,
    camera.position.x,
    camera.position.y,
    camera.position.z
  );
  mat4.translate(viewMatrix, viewMatrix, translation);

  return viewMatrix;
};

const getModelViewMatrix = (transform: Transform, viewMatrix: mat4) => {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [
    transform.position.x,
    transform.position.y,
    transform.position.z
  ]);

  mat4.rotateX(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation.x)
  );
  mat4.rotateY(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation.y)
  );
  mat4.rotateZ(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation.z)
  );

  mat4.scale(modelViewMatrix, modelViewMatrix, [
    transform.scale.x,
    transform.scale.y,
    transform.scale.z
  ]);

  const viewCurrent = mat4.clone(viewMatrix);
  return mat4.mul(viewCurrent, viewCurrent, modelViewMatrix);
};

export function getDraw(r: regl.Regl) {
  const drawShape = r({
    frag: `
    precision mediump float;
    varying vec3 vnormal;
    void main() {
      gl_FragColor = vec4(abs(vnormal), 1.0);
    }`,

    vert: `
    attribute vec3 position, normal;
    varying vec3 vnormal;
    uniform mat4 modelViewMatrix, projectionMatrix;
  
    void main() {
      vnormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }`,

    attributes: {
      position: bunny.positions,
      normal: normals(bunny.cells, bunny.positions)
    },

    uniforms: {
      modelViewMatrix: ({ tick }, props) => {
        return getModelViewMatrix(props.transform, getViewMatrix(props.camera));
      },
      projectionMatrix: ({ viewportWidth, viewportHeight }) => {
        return mat4.perspective(
          mat4.create(),
          (Math.PI * 45) / 180,
          viewportWidth / viewportHeight,
          0.1,
          1000
        );
      }
    },
    elements: bunny.cells
  });

  const drawShapes = (state: State, clientId: string) => {
    // create a camera based on the client's player

    const playerEntity = _.first(
      state.filter(entity => entity.id === clientId)
    );

    const initCamera = (transform: Transform): Camera => {
      return {
        rotation: { x: 0, y: 0, z: 0 },
        position: {
          x: transform.position.x * -1,
          y: transform.position.y * -1 - 4,
          z: transform.position.z * -1 - 50
        }
      };
    };

    const camera: Camera = playerEntity
      ? initCamera(playerEntity.transform)
      : initCamera({
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        });

    const transforms = state
      .filter(entity => entity.transform)
      .map(entity => {
        return { transform: entity.transform, camera };
      });

    drawShape(transforms);
  };

  return drawShapes;
}

// window.onload = () => {
//   const canvas = document.getElementById("canvas");

//   let cameraAngle = {
//     y: 0
//   };

//   document.addEventListener("keydown", e => {
//     cameraAngle.y = e.code === "ArrowLeft" ? cameraAngle.y - 1 : cameraAngle.y;
//     cameraAngle.y = e.code === "ArrowRight" ? cameraAngle.y + 1 : cameraAngle.y;
//   });

//   drawFrames(regl(canvas), {});
// };
