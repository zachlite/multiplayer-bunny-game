import { mat4 } from "gl-matrix";

export const getProjectionMatrix = (
  viewportWidth: number,
  viewportHeight: number
) => {
  return mat4.perspective(
    mat4.create(),
    (Math.PI * 45) / 180,
    viewportWidth / viewportHeight,
    0.1,
    1000
  );
};
