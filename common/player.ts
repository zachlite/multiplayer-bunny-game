import * as _ from "lodash";
import { Entity, EntityType, MeshTypes } from "./interfaces";

const scale = 10;

export function initPlayer(id: string, meshType: MeshTypes): Entity {
  const startPosition = {
    x: _.sample(_.range(50)),
    y: 5,
    z: _.sample(_.range(50))
  };
  return {
    id,
    type: EntityType.PLAYER,
    mesh: { meshType },
    body: {
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
      debug__activeCollision: false,
      debug__drawOutline: true
    }
  };
}

// client controls player that matches clientId
// update step to have take clientId as an arg
