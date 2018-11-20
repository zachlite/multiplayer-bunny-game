import regl, { Vec3 } from "regl";
import _ from "lodash";
import { mat4 } from "gl-matrix";
const bunny = require("bunny");
const normals = require("angle-normals");

interface Camera {
  position: Vec3;
  rotation: Vec3;
}

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

window.onload = () => {
  const canvas = document.getElementById("canvas");
  const r = regl(canvas);

  const drawTriangle = r({
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
      // position: (ctx, props) => {
      //   return [
      //     // front
      //     [[-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]],

      //     // back
      //     [[-1, 1, -1], [1, 1, -1], [1, -1, -1], [-1, -1, -1]],

      //     // top
      //     [[-1, 1, -1], [1, -1, -1], [1, 1, 1], [-1, 1, 1]],

      //     // bottom
      //     [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],

      //     // left
      //     [[-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [-1, -1, -1]],

      //     // right
      //     [[1, 1, 1], [1, 1, -1], [1, -1, -1], [1, -1, 1]]
      //   ];
      // }
      position: bunny.positions,
      normal: normals(bunny.cells, bunny.positions)
    },

    uniforms: {
      modelViewMatrix: ({ tick }, props) => {
        console.log(props);
        // const t = 0.01 * tick;
        // const m = mat4.lookAt({} as any, [0, 0, 0], [0, 0, 0], [0, 1, 0]);
        // return Object.keys(m).map(key => m[key]);
        const transform: Transform = {
          position: [0, -1, 0],
          rotation: [0, Math.sin(degreeToRadian(tick)) * 100, 0],
          scale: [1, 1, 0.01]
        };
        const camera: Camera = {
          rotation: [0, props.y, 0],
          position: [0, 0, -20]
        };
        return getModelViewMatrix(transform, getViewMatrix(camera));
      },
      projectionMatrix: ({ viewportWidth, viewportHeight }) => {
        return mat4.perspective(
          mat4.create(),
          (Math.PI * 45) / 180,
          640 / 480,
          0.1,
          100
        );
      }
    },
    elements: bunny.cells
    // elements: [
    //   // front
    //   [0, 1, 2, 2, 3, 0],
    //   // back
    //   [4, 5, 6, 6, 7, 4],
    //   // top
    //   [8, 9, 10, 10, 11, 8],
    //   // bottom
    //   [12, 13, 14, 14, 15, 12],
    //   // left
    //   [16, 17, 18, 18, 19, 16],
    //   // right
    //   [20, 21, 22, 22, 23, 20]
    // ]
  });

  let cameraAngle = {
    y: 0
  };

  document.addEventListener("keydown", e => {
    cameraAngle.y = e.code === "ArrowLeft" ? cameraAngle.y - 1 : cameraAngle.y;
    cameraAngle.y = e.code === "ArrowRight" ? cameraAngle.y + 1 : cameraAngle.y;
  });

  r.frame(context => {
    r.clear({
      color: [0, 0, 0, 1],
      depth: 1
    });
    drawTriangle({ ...cameraAngle });
  });

  // (function loop() {
  //   drawTriangle({ thing: 0 });
  //   window.requestAnimationFrame(loop);
  // })();
};
