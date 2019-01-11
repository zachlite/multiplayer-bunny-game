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
import { TextMesh } from "./drawText";

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
          [[255, 0, 255], [0, 255, 255, 0]],
          [[0, 255, 255, 0], [255, 0, 255]]
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

  const vectorizeText = require("vectorize-text");

  // const lookAt = require("gl-mat4/lookAt");
  // const perspective = require("gl-mat4/perspective");

  // const drawText = r({

  //   attributes: {
  //     position: textMesh.positions
  //   },

  //   elements: textMesh.edges,

  //   uniforms: {
  //     t: ({ tick }) => 0.01 * tick,

  //     view: ({ tick }) => {
  //       const t = 0.01 * tick;
  //       return lookAt(
  //         [],
  //         [5 * Math.sin(t), 0, -5 * Math.cos(t)],
  //         [0, 0, 0],
  //         [0, -1, 0]
  //       );
  //     },

  //     projection: ({ viewportWidth, viewportHeight }) =>
  //       perspective([], Math.PI / 4, viewportWidth / viewportHeight, 0.01, 1000)
  //   },

  //   depth: { enable: false }
  // });

  const textConfig = {
    triangles: true,
    textBaseline: "middle",
    fontSize: "12px",
    fontWeight: "100"
  };

  const textMeshes = {
    "0": TextMesh(r, { ...vectorizeText("0", textConfig) }),
    "1": TextMesh(r, { ...vectorizeText("1", textConfig) }),
    "2": TextMesh(r, { ...vectorizeText("2", textConfig) }),
    "3": TextMesh(r, { ...vectorizeText("3", textConfig) }),
    "4": TextMesh(r, { ...vectorizeText("4", textConfig) }),
    "5": TextMesh(r, { ...vectorizeText("5", textConfig) }),
    "6": TextMesh(r, { ...vectorizeText("6", textConfig) }),
    "7": TextMesh(r, { ...vectorizeText("6", textConfig) }),
    "8": TextMesh(r, { ...vectorizeText("6", textConfig) }),
    "9": TextMesh(r, { ...vectorizeText("6", textConfig) })
  };

  return (state: State, clientId: string) => {
    // create camera for player
    const player: Entity | undefined = _.first(
      state.filter(entity => entity.id === clientId)
    );

    // get camera
    const camera = getCamera(player ? player.body.transform : undefined);

    state.forEach(entity => {
      if (entity.body !== undefined && entity.isActive) {
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

    // draw player's score
    const score = state.find(e => e.id === clientId).score.toString();

    score.split("").forEach((digit, i) => {
      textMeshes[digit].draw({
        modelViewMatrix: getModelViewMatrix(
          {
            position: { x: 40 + i * 5, y: 40, z: 0 },
            rotation: { x: 180, y: 0, z: 0 },
            scale: { x: 20, y: 20, z: 20 }
          },
          {
            position: { x: 0, y: 0, z: -100 },
            rotation: { x: 0, y: 0, z: 0 }
          }
        ),
        projectionMatrix
      });
    });
  };
};
