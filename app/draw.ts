import regl from "regl";
import _ from "lodash";
import {
  State,
  Transform,
  Camera,
  Entity,
  MeshTypes,
  EntityType
} from "../common/interfaces";
import { degreeToRadian } from "../common/math";

import { Mesh, MeshData } from "./mesh";
import { getProjectionMatrix } from "./projectionMatrix";
import { getModelViewMatrix } from "./modelViewMatrix";

const bunny = require("bunny");
const teapot = require("teapot");

import { normalizeVertices, centerYAxis } from "./meshes/utils";
import { ground } from "./meshes/ground";
import { cube } from "./meshes/cube";

import { defaultShader } from "./shaders/default";
import { cube as cubeShader } from "./shaders/cube";
import { boundingBox as boundingBoxShader } from "./shaders/boundingBox";
import { boundingBox } from "./meshes/boundingBox";

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
    [MeshTypes.BUNNY]: Mesh(r, {
      spatialData: {
        positions: centerYAxis(normalizeVertices(bunny.positions)),
        cells: bunny.cells
      },
      shaders: defaultShader
    }),
    [MeshTypes.TEAPOT]: Mesh(r, {
      spatialData: {
        positions: normalizeVertices(teapot.positions),
        cells: teapot.cells
      },
      shaders: defaultShader
    }),
    [MeshTypes.GROUND]: Mesh(r, {
      spatialData: ground,
      shaders: cubeShader,
      textureData: {
        texture: r.texture([[[0, 0, 255]]]),
        coordinates: [[0, 0], [0, 0], [0, 0], [0, 0]]
      }
    }),
    [MeshTypes.CUBE]: Mesh(r, {
      spatialData: cube,
      shaders: cubeShader,
      textureData: {
        texture: r.texture([
          [[255, 0, 255], [0, 0, 0, 0]],
          [[0, 0, 0, 0], [255, 0, 255]]
        ]),
        coordinates: cube.textureCoordinates
      }
    }),

    [MeshTypes.BOUNDING_BOX]: Mesh(r, {
      spatialData: boundingBox,
      shaders: boundingBoxShader,
      primitive: "lines"
    }),

    [MeshTypes.TRIGGER]: Mesh(r, {
      spatialData: cube,
      shaders: cubeShader,
      textureData: {
        texture: r.texture([
          [[255, 255, 0], [0, 0, 0, 0]],
          [[0, 0, 0, 0], [255, 255, 0]]
        ]),
        coordinates: cube.textureCoordinates
      }
    })
  };

  const projectionMatrix = getProjectionMatrix(1080, 720);

  return (state: State, clientId: string) => {
    // create camera for player
    const player: Entity | undefined = _.first(
      state.filter(entity => entity.id === clientId)
    );

    // get camera
    const camera = getCamera(player ? player.body.transform : undefined);

    state.forEach(entity => {
      if (entity.body !== undefined) {
        const modelViewMatrix = getModelViewMatrix(
          entity.body.transform,
          camera
        );

        meshes[entity.mesh.meshType].draw({
          modelViewMatrix,
          projectionMatrix
        });
      }

      if (entity.collider !== undefined && entity.collider.debug__drawOutline) {
        const boundingBoxTransform: Transform = {
          position: entity.collider.position,
          scale: entity.collider.scale,
          rotation: { x: 0, y: 0, z: 0 }
        };

        meshes[MeshTypes.BOUNDING_BOX].draw({
          modelViewMatrix: getModelViewMatrix(boundingBoxTransform, camera),
          projectionMatrix,
          color: entity.collider.debug__activeCollision ? [1, 0, 0] : [1, 1, 1]
        });
      }
    });
  };
};
