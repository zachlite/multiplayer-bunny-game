export function TextMesh(r, { positions, cells }) {
  return {
    draw: r({
      frag: `
      precision mediump float;
      uniform float t;
      void main () {
        gl_FragColor = vec4(
          1.0,
          1.0,
          1.0,
          1);
      }`,

      vert: `
      attribute vec2 position;
      uniform mat4 projectionMatrix, modelViewMatrix;
      void main () {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 0, 1);
      }`,
      uniforms: {
        t: ({ tick }) => 0.01 * tick,
        modelViewMatrix: (context, props) => props.modelViewMatrix,
        projectionMatrix: (context, props) => props.projectionMatrix
        // vcolor: (context, props) => props.color || [1, 1, 1]
      },
      elements: cells,
      attributes: { position: positions },
      depth: { enable: false }
    })
  };
}
