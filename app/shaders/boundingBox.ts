export const boundingBox = {
  vert: `
  attribute vec3 position;
  uniform mat4 modelViewMatrix, projectionMatrix;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
  }`,
  frag: `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1, 1, 0, 1);
  }
  `
};

// const drawBoundingBox = r({
//   vert: `
//   attribute vec3 position;
//   uniform mat4 modelViewMatrix, projectionMatrix;
//   void main() {
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
//   }
//   `,
//   frag: `
//   precision mediump float;
//   void main() {
//     gl_FragColor = vec4(0, 1, 0, 1);
//   }`,
//   primitive: "line loop",
//   attributes: {
//     position: cube.positions
//   },
//   uniforms: {
//     modelViewMatrix: (context, props) => props.modelViewMatrix,
//     projectionMatrix: (context, props) => props.projectionMatrix
//   },
//   elements: cube.cells
// });
