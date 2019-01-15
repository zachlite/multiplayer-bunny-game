const vectorizeText = require("vectorize-text");

function TextMesh(r, { positions, cells }) {
  return {
    draw: r({
      frag: `
      precision mediump float;
      uniform vec3 vcolor;
      void main () {
        gl_FragColor = vec4(vcolor, 1);
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
        projectionMatrix: (context, props) => props.projectionMatrix,
        vcolor: (context, props) => props.color || [1, 1, 1]
      },
      elements: cells,
      attributes: { position: positions },
      depth: { enable: false }
    })
  };
}

const textConfig = {
  triangles: true,
  font: "monospace"
};

export function drawExample(r) {
  const { cells, positions } = vectorizeText("wassssssup", textConfig);
  console.log(positions.length);
  return TextMesh(r, { cells, positions });
}

export function getTextMeshes(r) {
  const chars = "abcdefghijlkmnopqrstuvwxyz0123456789-: ";

  const meshes = chars.split("").reduce((acc, curr) => {
    return {
      ...acc,
      [curr]: TextMesh(r, { ...vectorizeText(curr, textConfig) })
    };
  }, {});

  return meshes;
}
