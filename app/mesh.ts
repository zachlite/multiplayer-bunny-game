import regl from "regl";
const normals = require("angle-normals");

export interface MeshData {
  spatialData: { positions: number[][]; cells: number[][] };
  shaders: { vert: string; frag: string };
  textureData?: { texture: regl.Texture2D; coordinates: number[][] };
  glAttributes?: { position: any; normal: any; textureCoord };
  primitive?: string;
}

export const Mesh = (r: regl.Regl, meshData: MeshData) => {
  const defaultUniforms = {
    modelViewMatrix: (context, props) => props.modelViewMatrix,
    projectionMatrix: (context, props) => props.projectionMatrix
  };

  const { spatialData, shaders, textureData } = meshData;

  const imageUniforms = {
    ...defaultUniforms,
    texture: textureData ? textureData.texture : undefined
  };

  let defaultAttributes = {
    position: spatialData.positions
  };

  if (meshData.primitive !== "lines") {
    defaultAttributes["normal"] = normals(
      spatialData.cells,
      spatialData.positions
    );
  }

  const imageAttributes = {
    ...defaultAttributes,
    textureCoord: textureData ? textureData.coordinates : undefined
  };

  return {
    draw: r({
      vert: shaders.vert,
      frag: shaders.frag,
      primitive: meshData.primitive || "triangles",
      attributes: textureData ? imageAttributes : defaultAttributes,
      uniforms: textureData ? imageUniforms : defaultUniforms,
      elements: spatialData.cells
    })
  };
};
