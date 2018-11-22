import { Camera, Transform } from "../common/interfaces";
import { mat4, vec3 } from "gl-matrix";
import { degreeToRadian } from "../common/math";

const getViewMatrix = (camera: Camera) => {
  let viewMatrix = mat4.create();
  mat4.rotateX(viewMatrix, viewMatrix, degreeToRadian(camera.rotation.x));
  mat4.rotateY(viewMatrix, viewMatrix, degreeToRadian(camera.rotation.y));

  let translation = vec3.create();
  vec3.set(
    translation,
    camera.position.x,
    camera.position.y,
    camera.position.z
  );
  mat4.translate(viewMatrix, viewMatrix, translation);

  return viewMatrix;
};

export const getModelViewMatrix = (transform: Transform, camera: Camera) => {
  const viewMatrix: mat4 = getViewMatrix(camera);

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [
    transform.position.x,
    transform.position.y,
    transform.position.z
  ]);

  mat4.rotateX(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation.x)
  );
  mat4.rotateY(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation.y)
  );
  mat4.rotateZ(
    modelViewMatrix,
    modelViewMatrix,
    degreeToRadian(transform.rotation.z)
  );

  mat4.scale(modelViewMatrix, modelViewMatrix, [
    transform.scale.x,
    transform.scale.y,
    transform.scale.z
  ]);

  const viewCurrent = mat4.clone(viewMatrix);
  return mat4.mul(viewCurrent, viewCurrent, modelViewMatrix);
};
