import regl from "regl";
import _ from "lodash";
import {
  State,
  Transform,
  Camera,
  Entity,
  MeshTypes
} from "../common/interfaces";
import { Mesh } from "./mesh";
import { getProjectionMatrix } from "./projectionMatrix";
import { getModelViewMatrix } from "./modelViewMatrix";
const bunny = require("bunny");
const teapot = require("teapot");

// initialize meshes once

// initialize projection matrix once

// every frame:

// recalculate modelViewMatrix, and batch draw.

const CAMERA_ANGLE = 20;
const CAMERA_HEIGHT = 30;
const CAMERA_DEPTH = 50;

const getCamera = (transform?: Transform): Camera => {
  const cameraRotation = { x: CAMERA_ANGLE, y: 0, z: 0 };
  const position = transform ? transform.position : { x: 0, y: 0, z: 0 };
  const cameraPosition = {
    x: position.x * -1,
    y: position.y * -1 - CAMERA_HEIGHT,
    z: position.z * -1 - CAMERA_DEPTH
  };
  return {
    rotation: cameraRotation,
    position: cameraPosition
  };
};

export const initDrawing = (r: regl.Regl) => {
  const meshes = {
    [MeshTypes.BUNNY]: Mesh(r, bunny),
    [MeshTypes.TEAPOT]: Mesh(r, teapot)
  };

  const projectionMatrix = getProjectionMatrix(640, 480);

  return (state: State, clientId: string) => {
    // create camera for player
    const player: Entity | undefined = _.first(
      state.filter(entity => entity.id === clientId)
    );

    // get camera
    const camera = getCamera(player ? player.transform : undefined);

    state.forEach(entity => {
      meshes[entity.meshType].draw({
        modelViewMatrix: getModelViewMatrix(entity.transform, camera),
        projectionMatrix
      });
    });
  };
};
