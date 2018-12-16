const combinatorics = require("js-combinatorics");
import * as _ from "lodash";
import {
  Vec3,
  BoundingBox,
  Entity,
  Message,
  MessageType,
  CollisionActiveMessage,
  CollisionStartMessage,
  CollisionEndMessage
} from "./interfaces";

function axisOfCollision({ aX, aY, aZ }, { bX, bY, bZ }): "x" | "y" | "z" {
  const distances = {
    x: Math.min(...[Math.abs(aX.min - bX.max), Math.abs(aX.max - bX.min)]),
    y: Math.min(...[Math.abs(aY.min - bY.max), Math.abs(aY.max - bY.min)]),
    z: Math.min(...[Math.abs(aZ.min - bZ.max), Math.abs(aZ.max - bZ.min)])
  };

  const axis = _.keys(distances).find(
    key => distances[key] === Math.min(..._.values(distances))
  );

  return axis as "x" | "y" | "z";
}

function intersect(
  a: { position: Vec3; boundingBox: BoundingBox },
  b: { position: Vec3; boundingBox: BoundingBox }
):
  | { collision: true; axisOfCollision: "x" | "y" | "z" }
  | { collision: false } {
  const minMax = (
    bb: { position: Vec3; boundingBox: BoundingBox },
    axis: "x" | "y" | "z"
  ) => {
    return {
      min: bb.position[axis] - bb.boundingBox.offset[axis],
      max: bb.position[axis] + bb.boundingBox.offset[axis]
    };
  };

  const aX = minMax(a, "x");
  const aY = minMax(a, "y");
  const aZ = minMax(a, "z");

  const bX = minMax(b, "x");
  const bY = minMax(b, "y");
  const bZ = minMax(b, "z");

  const collided =
    aX.min <= bX.max &&
    aX.max >= bX.min &&
    (aY.min <= bY.max && aY.max >= bY.min) &&
    (aZ.min <= bZ.max && aZ.max >= bZ.min);

  return collided
    ? {
        collision: true,
        axisOfCollision: axisOfCollision({ aX, aY, aZ }, { bX, bY, bZ })
      }
    : { collision: false };
}

// global array to store active collisions
let activeCollisions = [];

export function collisionSystem(entities: Entity[]): Message[] {
  if (entities.length < 2) return [];

  const pairs: [Entity, Entity][] = combinatorics
    .combination(entities, 2)
    .toArray();

  const collisionMessage = (
    pair: [Entity, Entity]
  ):
    | CollisionActiveMessage
    | CollisionStartMessage
    | CollisionEndMessage
    | null => {
    const entity1 = {
      position: pair[0].body.transform.position,
      boundingBox: pair[0].boundingBox
    };

    const entity2 = {
      position: pair[1].body.transform.position,
      boundingBox: pair[1].boundingBox
    };

    const collisionCheck = intersect(entity1, entity2);
    const pairIdentifier = _.orderBy([pair[0].id, pair[1].id]).join("-");
    const pairAlreadyColliding = _.includes(activeCollisions, pairIdentifier);

    if (collisionCheck.collision && pairAlreadyColliding) {
      return {
        subject: MessageType.COLLISION_ACTIVE,
        entityIds: [pair[0].id, pair[1].id],
        axisOfCollision: collisionCheck.axisOfCollision
      };
    }

    if (collisionCheck.collision && !pairAlreadyColliding) {
      activeCollisions.push(pairIdentifier);
      return {
        subject: MessageType.COLLISION_START,
        axisOfCollision: collisionCheck.axisOfCollision,
        entityIds: [pair[0].id, pair[1].id]
      };
    }

    if (!collisionCheck.collision && pairAlreadyColliding) {
      activeCollisions = activeCollisions.filter(ac => ac !== pairIdentifier);
      return {
        subject: MessageType.COLLISION_END,
        entityIds: [pair[0].id, pair[1].id]
      };
    }

    return null;
  };

  const collisions = pairs.map(pair => collisionMessage(pair)).filter(x => x);

  return collisions;
}
