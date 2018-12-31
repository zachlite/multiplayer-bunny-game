const boxIntersect = require("box-intersect");
import * as _ from "lodash";
import {
  Vec3,
  Collider,
  Entity,
  Message,
  MessageType,
  CollisionActiveMessage,
  CollisionStartMessage,
  CollisionEndMessage,
  TriggerActiveMessage
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

const minMax = (collider: Collider, axis: "x" | "y" | "z") => {
  return {
    min: collider.position[axis] - collider.scale[axis],
    max: collider.position[axis] + collider.scale[axis]
  };
};

const colliderMinMax = (collider: Collider) => {
  return {
    x: minMax(collider, "x"),
    y: minMax(collider, "y"),
    z: minMax(collider, "z")
  };
};

// global array to store active collisions
let activeCollisions: string[] = [];

const pairIdentifier = (id1: string, id2: string) =>
  _.orderBy([id1, id2]).join("-");

const getCollisionMessage = (
  pair: [Entity, Entity]
): CollisionActiveMessage | CollisionStartMessage | TriggerActiveMessage => {
  // this is only invoked for pairs we know are colliding.

  if (pair[0].collider.isTrigger || pair[1].collider.isTrigger) {
    return {
      subject: MessageType.TRIGGER_ACTIVE,
      triggerId: pair[0].collider.isTrigger ? pair[0].id : pair[1].id,
      entityId: pair[0].collider.isTrigger ? pair[1].id : pair[0].id
    };
  }

  const pairId = pairIdentifier(pair[0].id, pair[1].id);
  const pairAlreadyColliding = _.includes(activeCollisions, pairId);

  const a = colliderMinMax(pair[0].collider);
  const b = colliderMinMax(pair[1].collider);

  const axis = axisOfCollision(
    { aX: a.x, aY: a.y, aZ: a.z },
    { bX: b.x, bY: b.y, bZ: b.z }
  );

  if (pairAlreadyColliding) {
    return {
      subject: MessageType.COLLISION_ACTIVE,
      entityIds: [pair[0].id, pair[1].id],
      axisOfCollision: axis
    };
  } else {
    activeCollisions.push(pairId);
    return {
      subject: MessageType.COLLISION_START,
      axisOfCollision: axis,
      entityIds: [pair[0].id, pair[1].id]
    };
  }
};

export function collisionSystem(entities: Entity[]): Message[] {
  if (entities.length < 2) return [];

  // feed list of minX, MinY, MaxX, MaxY
  // get back colliding pairs
  // get axis of collision for each colliding pair
  // create messages
  // return messages

  const bounds = (collider: Collider) => {
    const a = colliderMinMax(collider);
    return [a.x.min, a.y.min, a.z.min, a.x.max, a.y.max, a.z.max];
  };

  const collisions: number[][] = boxIntersect(
    entities.map(e => bounds(e.collider))
  );

  const collisionPairs = collisions.map(collision => {
    const e1 = entities[collision[0]];
    const e2 = entities[collision[1]];
    return [e1, e2] as [Entity, Entity];
  });

  const collisionMessages = collisionPairs
    .map(pair => getCollisionMessage(pair))
    .filter(x => x);

  return [...collisionMessages, ...collisionEndMessages(collisionPairs)];
}

function collisionEndMessages(
  pairsColliding: [Entity, Entity][]
): CollisionEndMessage[] {
  // go through all active collisions, check if the pair is in pairs colliding.

  const pairIds = pairsColliding.map(pair =>
    pairIdentifier(pair[0].id, pair[1].id)
  );

  const collisionEnds = activeCollisions
    .map(active => {
      const over = !_.includes(pairIds, active);

      if (over) {
        activeCollisions = activeCollisions.filter(ac => ac !== active);
        return {
          subject: MessageType.COLLISION_END,
          entityIds: active.split("-")
        };
      } else {
        return null;
      }
    })
    .filter(x => x);

  return collisionEnds;
}
