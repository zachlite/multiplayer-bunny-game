export const cube = {
  vert: `
  attribute vec3 position;
  attribute vec2 textureCoord;
  uniform mat4 modelViewMatrix, projectionMatrix;

  varying highp vec2 vTextureCoord;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    vTextureCoord = textureCoord;
  }`,

  frag: `
  #ifdef GL_ES
  precision mediump float;
  #endif

  varying highp vec2 vTextureCoord;
  uniform sampler2D texture;

  void main() {
    gl_FragColor = texture2D(texture, vTextureCoord);
  }
  `
};
