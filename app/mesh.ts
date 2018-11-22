import regl from "regl";
const normals = require("angle-normals");

export const Mesh = (
  r: regl.Regl,
  { positions, cells }: { positions: regl.Buffer; cells: regl.Buffer }
) => {
  return {
    draw: r({
      vert: `
      attribute vec3 position, normal;
      varying vec3 vnormal;
      uniform mat4 modelViewMatrix, projectionMatrix;
    
      void main() {
        vnormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
      }`,

      frag: `
      precision mediump float;
      varying vec3 vnormal;
      void main() {
        gl_FragColor = vec4(abs(vnormal), 1.0);
      }`,

      attributes: {
        position: positions,
        normal: normals(cells, positions)
      },
      uniforms: {
        modelViewMatrix: (context, props) => props.modelViewMatrix,
        projectionMatrix: (context, props) => props.projectionMatrix
      },
      elements: cells
    })
  };
};
