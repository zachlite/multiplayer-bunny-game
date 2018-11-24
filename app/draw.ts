import regl from "regl";
import _ from "lodash";
import {
  State,
  Transform,
  Camera,
  Entity,
  MeshTypes
} from "../common/interfaces";
import { degreeToRadian } from "../common/math";

import { Mesh } from "./mesh";
import { getProjectionMatrix } from "./projectionMatrix";
import { getModelViewMatrix } from "./modelViewMatrix";

const bunny = require("bunny");
const teapot = require("teapot");
import { ground } from "./meshes/ground";
import { cube } from "./meshes/cube";

import { defaultShader } from "./shaders/default";
import { cube as cubeShader } from "./shaders/cube";

// initialize meshes once

// initialize projection matrix once

// every frame:

// recalculate modelViewMatrix, and batch draw.

const CAMERA_ANGLE = 20;
const CAMERA_HEIGHT = 30;
const CAMERA_DEPTH = 100;

const getCamera = (transform?: Transform): Camera => {
  const cameraRotation = {
    x: CAMERA_ANGLE,
    y: transform.rotation.y * -1,
    z: 0
  };
  const position = transform ? transform.position : { x: 0, y: 0, z: 0 };
  const cameraPosition = {
    x:
      CAMERA_DEPTH * Math.sin(degreeToRadian(transform.rotation.y)) * -1 -
      position.x,
    z:
      CAMERA_DEPTH * Math.cos(degreeToRadian(transform.rotation.y)) * -1 -
      position.z,
    y: position.y * -1 - CAMERA_HEIGHT
  };
  return {
    rotation: cameraRotation,
    position: cameraPosition
  };
};

export const initDrawing = (r: regl.Regl) => {
  const meshes = {
    [MeshTypes.BUNNY]: Mesh(r, bunny, defaultShader),
    [MeshTypes.TEAPOT]: Mesh(r, teapot, defaultShader),
    [MeshTypes.GROUND]: Mesh(r, ground as any, defaultShader),
    [MeshTypes.CUBE]: Mesh(r, cube as any, cubeShader, {
      texture: r.texture([
        [[255, 0, 255], [0, 0, 0, 0]],
        [[0, 0, 0, 0], [255, 0, 255]]
      ]),
      coordinates: cube.textureCoordinates
    })
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
