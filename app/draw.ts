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
import { PLAYERS_PER_PARTY } from "../common/constants";

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
import { getTextMeshes } from "./textMeshes";

// initialize meshes once

// initialize projection matrix once

// every frame:

// recalculate modelViewMatrix, and batch draw.

const defaultCameraSettings = {
  angle: 20,
  height: 30,
  depth: 100
};

const getCamera = (
  transform?: Transform,
  settings = defaultCameraSettings
): Camera => {
  const cameraRotation = {
    x: settings.angle,
    y: transform.rotation.y * -1,
    z: 0
  };
  const position = transform ? transform.position : { x: 0, y: 0, z: 0 };
  const cameraPosition = {
    x:
      settings.depth * Math.sin(degreeToRadian(transform.rotation.y)) * -1 -
      position.x,
    z:
      settings.depth * Math.cos(degreeToRadian(transform.rotation.y)) * -1 -
      position.z,
    y: position.y * -1 - settings.height
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
  const textMeshes = getTextMeshes(r);
  const textCamera = {
    position: { x: 0, y: 0, z: -100 },
    rotation: { x: 0, y: 0, z: 0 }
  };

  function drawText(text: string, transform, letterSpacing, color) {
    text.split("").forEach((char, i) => {
      textMeshes[char].draw({
        modelViewMatrix: getModelViewMatrix(
          {
            ...transform,
            position: {
              ...transform.position,
              x: transform.position.x + letterSpacing * i
            }
          },
          textCamera
        ),
        projectionMatrix,
        color
      });
    });
  }

  function drawScores(players: Entity[], clientId) {
    _.orderBy(players, "score", "desc").forEach((player, i) => {
      const scale = 2;

      const textTransform = {
        position: { x: -60, y: 35 - 3 * i, z: 0 },
        rotation: { x: 180, y: 0, z: 0 },
        scale: { x: scale, y: scale, z: scale }
      };

      drawText(
        `${player.id}: ${player.score}`,
        textTransform,
        1.2,
        player.id === clientId ? [0, 1, 0] : [1, 1, 1]
      );
    });
  }

  return {
    drawLobby: (state: State, clientId: string) => {
      const playersInLobby = state.filter(e => e.type === "PLAYER");

      drawText(
        `Party Lobby`,
        {
          position: { x: -15, y: 25, z: 0 },
          rotation: { x: 180, y: 0, z: 0 },
          scale: { x: 4, y: 4, z: 4 }
        },
        2.5,
        [1, 1, 1]
      );

      drawText(
        `Waiting for ${PLAYERS_PER_PARTY - playersInLobby.length} more players`,
        {
          position: { x: -15, y: 15, z: 0 },
          rotation: { x: 180, y: 0, z: 0 },
          scale: { x: 2, y: 2, z: 2 }
        },
        1.2,
        [1, 1, 1]
      );

      // display everyone in the lobby:
      playersInLobby.forEach((p, i) => {
        drawText(
          p.id,
          {
            position: { x: -10, y: 10 - 5 * i, z: 0 },
            rotation: { x: 180, y: 0, z: 0 },
            scale: { x: 2, y: 2, z: 2 }
          },
          1.2,
          p.id === clientId ? [0, 1, 0] : [1, 1, 1]
        );
      });

      // display instructions
      drawText(
        "Move with WASD. Jump with Space",
        {
          position: { x: -15, y: -30, z: 0 },
          rotation: { x: 180, y: 0, z: 0 },
          scale: { x: 1.5, y: 1.5, z: 1.5 }
        },
        1,
        [1, 1, 1]
      );
    },
    drawGame: (state: State, clientId: string) => {
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

        if (
          entity.collider !== undefined &&
          entity.collider.debug__drawOutline
        ) {
          const boundingBoxTransform: Transform = {
            position: entity.collider.position,
            scale: entity.collider.scale,
            rotation: { x: 0, y: 0, z: 0 }
          };

          meshes[MeshTypes.BOUNDING_BOX].draw({
            modelViewMatrix: getModelViewMatrix(boundingBoxTransform, camera),
            projectionMatrix,
            color: entity.collider.debug__activeCollision
              ? [1, 0, 0]
              : [1, 1, 1]
          });
        }
      });

      // draw all connected player scores
      drawScores(state.filter(e => e.type === "PLAYER"), clientId);

      // draw time remaining
      const timer = state.find(e => e.type === "TIMER");
      drawText(
        (timer.timer.timeRemaining / 1000).toFixed(0).toString(),
        {
          position: { x: 0, y: 35, z: 0 },
          rotation: { x: 180, y: 0, z: 0 },
          scale: { x: 3, y: 3, z: 3 }
        },
        1.2,
        [1, 1, 1]
      );
    },
    drawGameOver: (state: State, clientId: string) => {
      const winner = _.orderBy(
        state.filter(e => e.type === "PLAYER"),
        "score",
        "desc"
      )[0];

      const gameOverMessage = winner.id === clientId ? "victory!" : "defeated!";

      drawText(
        `${gameOverMessage}`,
        {
          position: { x: -10, y: 0, z: 0 },
          rotation: { x: 180, y: 0, z: 0 },
          scale: { x: 4, y: 4, z: 4 }
        },
        2.5,
        [1, 1, 1]
      );

      drawText(
        "press Enter to play again",
        {
          position: { x: -15, y: -10, z: 0 },
          rotation: { x: 180, y: 0, z: 0 },
          scale: { x: 2, y: 2, z: 2 }
        },
        1.2,
        [1, 1, 1]
      );
    }
  };
};
