import * as _ from "lodash";
import { Entity, EntityType } from "./interfaces";

export function initPlayer(id: string): Entity {
  return {
    id,
    type: EntityType.PLAYER,
    transform: { x: _.sample(_.range(10)), y: 20, width: 20, height: 20 },
    physics: { mass: 1, velocity: { x: 0, y: 0 } }
  };
}

// client controls player that matches clientId
// update step to have take clientId as an arg
