import * as _ from "lodash";
import { Entity, EntityType } from "./interfaces";

export function initPlayer(id: string): Entity {
  return {
    id,
    color: _.sample(["red", "green", "blue", "purple"]),
    type: EntityType.PLAYER,
    transform: { x: _.sample(_.range(100)), y: 0, width: 20, height: 20 }
  };
}

// client controls player that matches clientId
// update step to have take clientId as an arg
