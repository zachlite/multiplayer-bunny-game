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
        position: { x: _.sample(_.range(10)), y: 20, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }
    },
    boundingBox: {
      dimensions: { x: 5, y: 5, z: 5 },
      yOffset: 5
    }
  };
}

// client controls player that matches clientId
// update step to have take clientId as an arg
