import regl, { Vec3 } from "regl";
import _ from "lodash";
import { mat4 } from "gl-matrix";
import { State } from "../common/interfaces";
const bunny = require("bunny");
const normals = require("angle-normals");

interface Camera {
  position: Vec3;
  rotation: Vec3;
}

//TODO: reconcile this with other Transform type
interface Transform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

const degreeToRadian = (d: number) => d * 0.0174533;

const getViewMatrix = (camera: Camera) => {
  const viewMatrix = mat4.create();
  mat4.rotateX(viewMatrix, viewMatrix, degreeToRadian(camera.rotation[0]));
  mat4.rotateY(viewMatrix, viewMatrix, degreeToRadian(camera.rotation[1]));
  mat4.translate(viewMatrix, viewMatrix, [
    camera.position[0],
    camera.position[1],
    camera.position[2]
  ]);

  return viewMatrix;
};

const getModelViewMatrix = (transform: Transform, viewMatrix: mat4) => {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [
    transform.position[0],
    transform.position[1],
    transform.position[2]
  ]);

  mat4.rotateX(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation[0])
  );
  mat4.rotateY(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation[1])
  );
  mat4.rotateZ(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation[2])
  );

  mat4.scale(modelViewMatrix, modelViewMatrix, [
    transform.scale[0],
    transform.scale[1],
    transform.scale[2]
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
        const transform: Transform = {
          ...props.transform,
          rotation: [0, tick / 2, 0],
          scale: [1, 1, 1]
        };
        const camera: Camera = {
          rotation: [0, 0, 0],
          position: [0, 0, -100]
        };
        return getModelViewMatrix(transform, getViewMatrix(camera));
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

  const drawShapes = (state: State) => {
    const transforms = state
      .filter(entity => entity.transform)
      .map(entity => {
        const t: Transform = {
          position: [
            entity.transform.position.x,
            entity.transform.position.y,
            entity.transform.position.z
          ],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        };
        return { transform: t };
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
