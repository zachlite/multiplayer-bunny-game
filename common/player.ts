import * as _ from "lodash";
import { Entity, MeshTypes } from "./interfaces";

const scale = 10;

export function initPlayer(
  id: string,
  meshType: MeshTypes,
  color: number[]
): Entity {
  const startPosition = {
    x: _.sample(_.range(100)),
    y: 5,
    z: _.sample(_.range(100))
  };
  return {
    id,
    type: "PLAYER",
    isActive: true,
    color,
    mesh: { meshType },
    body: {
      useGravity: true,
      velocity: { x: 0, y: 0, z: 0 },
      transform: {
        position: startPosition,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: scale, y: scale, z: scale }
      }
    },
    collider: {
      position: startPosition,
      scale: { x: scale / 2, y: scale / 2, z: scale / 2 },
      isTrigger: false,
      isStatic: false,
      debug__activeCollision: false,
      debug__drawOutline: false
    },
    score: 0
  };
}

// client controls player that matches clientId
// update step to have take clientId as an arg
