import { mat4 } from "gl-matrix";
import { degreeToRadian } from "../common/math";
const FIELD_OF_VIEW = 45; // degrees

export const getProjectionMatrix = (
  viewportWidth: number,
  viewportHeight: number
) => {
  return mat4.perspective(
    mat4.create(),
    degreeToRadian(FIELD_OF_VIEW),
    viewportWidth / viewportHeight,
    0.1,
    1000
  );
};
