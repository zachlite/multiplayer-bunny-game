import * as _ from "lodash";
import { Entity, EntityType, MeshTypes } from "./interfaces";

export function initPlayer(id: string, meshType: MeshTypes): Entity {
  return {
    id,
    type: EntityType.PLAYER,
    mesh: { meshType },
    body: {
      velocity: { x: 0, y: 0, z: 0 },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 10, y: 10, z: 10 }
      }
    },
    boundingBox: {
      dimensions: { x: 10, y: 10, z: 10 },
      yOffset: 0
    }
  };
}

// client controls player that matches clientId
// update step to have take clientId as an arg
