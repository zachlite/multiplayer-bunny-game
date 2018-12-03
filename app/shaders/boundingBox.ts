export const boundingBox = {
  vert: `
  attribute vec3 position;
  uniform mat4 modelViewMatrix, projectionMatrix;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
  }`,
  frag: `
  precision mediump float;
  uniform vec3 vcolor;
  void main() {
    gl_FragColor = vec4(vcolor, 1);
  }
  `
};
