import regl from "regl";
const normals = require("angle-normals");

export const Mesh = (
  r: regl.Regl,
  { positions, cells }: { positions: regl.Buffer; cells: regl.Buffer },
  { vert, frag }: { vert: string; frag: string },
  image?: { texture: regl.Texture2D; coordinates: number[][] }
) => {
  const defaultUniforms = {
    modelViewMatrix: (context, props) => props.modelViewMatrix,
    projectionMatrix: (context, props) => props.projectionMatrix
  };

  const imageUniforms = {
    ...defaultUniforms,
    texture: image ? image.texture : undefined
  };

  const defaultAttributes = {
    position: positions,
    normal: normals(cells, positions)
  };

  const imageAttributes = {
    ...defaultAttributes,
    textureCoord: image ? image.coordinates : undefined
  };

  return {
    draw: r({
      vert,
      frag,
      attributes: image ? imageAttributes : defaultAttributes,
      uniforms: image ? imageUniforms : defaultUniforms,
      elements: cells
    })
  };
};
