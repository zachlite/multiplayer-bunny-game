const combinatorics = require("js-combinatorics");
import * as _ from "lodash";
import {
  Entity,
  State,
  Transform,
  Input,
  EntityType,
  Vec3,
  Message,
  MessageType,
  InputMessage,
  BoundingBox,
  CollisionMessage
} from "./interfaces";
import { FRAME } from "./clock";
import { degreeToRadian } from "./math";
import { getMessages, createMessage } from "./message";

// interface Message {
//   type: string;
//   data: any;
// }

interface Logic
  extends Array<
    [
      (e: Entity) => boolean,
      (entity: Entity, messages: Message[]) => [Entity, Message[]]
    ]
  > {}

// function collisionSystem(state: State): Message[] {
//   // find entities with transforms that overlap
//   const overlaps = (r1: Transform, r2: Transform) => {
//     return (
//       r1.x < r2.x + r2.width &&
//       r1.x + r1.width > r2.x &&
//       r1.y < r2.y + r2.height &&
//       r1.y + r1.height > r2.y
//     );
//   };

//   const withTransform = state.filter(entity => entity.transform);
//   const messages = _.flatten(
//     withTransform.map(entity1 => {
//       return withTransform.map(entity2 => {
//         if (entity1.id === entity2.id) return null;

//         return overlaps(entity1.transform, entity2.transform)
//           ? { type: "COLLISION", data: { a: entity1.id, b: entity2.id } }
//           : null;
//       });
//     })
//   ).filter(m => m);

//   return messages;
// }

const axisOfCollision = ({ aX, aY, aZ }, { bX, bY, bZ }): "x" | "y" | "z" => {
  const distances = {
    x: Math.min(...[Math.abs(aX.min - bX.max), Math.abs(aX.max - bX.min)]),
    y: Math.min(...[Math.abs(aY.min - bY.max), Math.abs(aY.max - bY.min)]),
    z: Math.min(...[Math.abs(aZ.min - bZ.max), Math.abs(aZ.max - bZ.min)])
  };

  const axis = _.keys(distances).find(
    key => distances[key] === Math.min(..._.values(distances))
  );

  return axis as "x" | "y" | "z";
};

// if there's an intersection, also return the axis of collision.
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

function collisionSystem(entities: Entity[]): Message[] {
  if (entities.length < 2) return [];

  const pairs: [Entity, Entity][] = combinatorics
    .combination(entities, 2)
    .toArray();

  const collisions = pairs
    .map(pair => {
      const collisionCheck = intersect(
        {
          position: pair[0].body.transform.position,
          boundingBox: pair[0].boundingBox
        },
        {
          position: pair[1].body.transform.position,
          boundingBox: pair[1].boundingBox
        }
      );

      return collisionCheck.collision
        ? ({
            subject: MessageType.COLLISION,
            axisOfCollision: collisionCheck.axisOfCollision,
            entities: pair.reduce((acc, curr) => {
              const velocityBeforeCollision = { ...curr.body.velocity };
              const positionBeforeCollision = {
                ...curr.body.transform.lastPosition
              };
              return {
                ...acc,
                [curr.id]: {
                  velocityBeforeCollision,
                  positionBeforeCollision
                }
              };
            }, {})
          } as CollisionMessage)
        : undefined;
    })
    .filter(x => x);

  return collisions;
}

// function enemyMovement(
//   entity: Entity,
//   messages: Message[]
// ): [Entity, Message[]] {
//   // move towards player.

//   // if the player moves, update follow.destination
//   const playerMovedMessage = messages.filter(
//     message => message.type === "PLAYER_MOVED"
//   );

//   const destination: { x: number; y: number } = playerMovedMessage.length
//     ? playerMovedMessage[0].data.position
//     : entity.follow.destination;

//   // update transform according to follow.destination
//   const { x, y } = destination;
//   const transform = { ...entity.transform, x: x + 30, y };
//   return [{ ...entity, transform, follow: { destination: { x, y } } }, []];
// }

function playerMovement(
  entity: Entity,
  messages: Message[]
): [Entity, Message[]] {
  // TODO: create message on flap

  // save position
  const lastPosition = { ...entity.body.transform.position };

  const inputMessage = _.first(
    getMessages(messages, MessageType.INPUT)
  ) as InputMessage;

  // const gravityMessage = _.first(
  //   getMessages(messages, MessageType.GRAVITY, entity.id)
  // ) as GravityMessage;

  const input = inputMessage.input;

  // Velocity
  const v = 0.001;
  const direction = input.forward ? 1 : -1;
  const thrust = input.forward || input.back ? 1 : 0;

  const vz =
    entity.body.velocity.z +
    thrust *
      direction *
      v *
      Math.sin(degreeToRadian(entity.body.transform.rotation.y - 90));

  const vx =
    entity.body.velocity.x +
    thrust *
      direction *
      v *
      Math.cos(degreeToRadian(entity.body.transform.rotation.y + 90));

  const vyFlap = input.flap
    ? entity.body.velocity.y + 0.06
    : entity.body.velocity.y;

  // decay
  const decay = (v: number) => (Math.abs(v) < 0.00001 ? 0 : v * 0.99);

  const velocity = {
    x: decay(vx),
    y: vyFlap,
    z: decay(vz)
  };

  // Position
  const dy = velocity.y * FRAME;
  const dx = velocity.x * FRAME;
  const dz = velocity.z * FRAME;

  const position: Vec3 = {
    y: entity.body.transform.position.y + dy,
    x: entity.body.transform.position.x + dx,
    z: entity.body.transform.position.z + dz
  };

  // Rotation
  const dRotY = input.left ? 1 : input.right ? -1 : 0;
  const rotation = {
    ...entity.body.transform.rotation,
    y: entity.body.transform.rotation.y + dRotY
  };

  const transform = {
    ...entity.body.transform,
    position,
    rotation,
    lastPosition
  };
  return [{ ...entity, body: { ...entity.body, transform, velocity } }, []];
}

// function playerHealth(
//   entity: Entity,
//   messages: Message[]
// ): [Entity, Message[]] {
//   const collisions = messages.filter(
//     message =>
//       message.type === "COLLISION" &&
//       (message.data.a === entity.id || message.data.b === entity.id)
//   );

//   const health = collisions.reduce((acc, curr) => {
//     return acc - 1;
//   }, entity.health.amount);

//   return [{ ...entity, health: { amount: health } }, []];
// }

function boundingBox(entity: Entity, messages: Message[]): [Entity, Message[]] {
  const collisions = messages.filter(
    (message: CollisionMessage) =>
      message.subject === MessageType.COLLISION &&
      _.includes(Object.keys(message.entities), entity.id)
  ) as CollisionMessage[];

  // TODO: deal with more than 1 simultaneous collision.
  // thought: if I only respond to 1 collision, will the 2nd collision still exist next frame?

  const adjustPosition = (axis: string) => {
    return collisions[0].axisOfCollision === axis
      ? collisions[0].entities[entity.id].positionBeforeCollision[axis]
      : entity.body.transform.position[axis];
  };

  const adjustedPosition = collisions.length
    ? {
        x: adjustPosition("x"),
        y: adjustPosition("y"),
        z: adjustPosition("z")
      }
    : entity.body.transform.position;

  const adjustVelocity = (axis: string, damping: number = 1) => {
    return collisions[0].axisOfCollision === axis
      ? damping * entity.body.velocity[axis] * -1
      : damping * entity.body.velocity[axis];
  };

  const adjustedVelocity = collisions.length
    ? {
        x: adjustVelocity("x"),
        y: adjustVelocity("y", 0.5),
        z: adjustVelocity("z")
      }
    : entity.body.velocity;

  const transform = {
    ...entity.body.transform,
    position: adjustedPosition
  };

  const body = { ...entity.body, transform, velocity: adjustedVelocity };

  const updatedEntity: Entity = {
    ...entity,
    body,
    boundingBox: {
      ...entity.boundingBox,
      activeCollision: collisions.length ? true : false
    }
  };

  return [updatedEntity, messages];
}

function gravityField(
  entity: Entity,
  messages: Message[]
): [Entity, Message[]] {
  // all entities with mass should experience a downwards acceleration of 9.8 m/s/s

  const GRAVITY = 0.0001;

  // create a new message with calculated vy
  const velocityWithGravity = {
    ...entity.body.velocity,
    y: entity.body.velocity.y - GRAVITY * FRAME
  };

  const newBody = { ...entity.body, velocity: velocityWithGravity };
  const newEntity = { ...entity, body: newBody };

  return [newEntity, []];
}

function system(
  state: State,
  messages: Message[],
  participants: (e: Entity) => boolean,
  update: (e: Entity, m: Message[]) => [Entity, Message[]]
): [State, Message[]] {
  const [entitiesWithComponent, entitiesWithout] = _.partition(
    state,
    participants
  );

  const updates: [Entity, Message[]][] = entitiesWithComponent.map(entity =>
    update(entity, messages)
  );

  const updatedEntities = updates.map(u => u[0]);
  const newMessages = _.flatten(updates.map(u => u[1]));
  const newState = [...updatedEntities, ...entitiesWithout];

  return [newState, newMessages];
}

export function step(
  state: State,
  inputMessages: Message[],
  clientId: string
): State {
  const messages = [
    ...inputMessages,
    ...collisionSystem(state.filter(entity => entity.boundingBox !== undefined))
  ];

  // TODO: need a better way to authenticate controls
  const logic: Logic = [
    [(e: Entity) => e.body !== undefined && e.id === clientId, gravityField],
    [(e: Entity) => e.boundingBox !== undefined, boundingBox],
    [(e: Entity) => e.id === clientId, playerMovement]
    // [(e: Entity) => e.follow !== undefined, enemyMovement]
  ];

  const nextState = logic.reduce(
    (acc, curr) => {
      const predicate = curr[0];
      const fn = curr[1];
      const [newState, newMessages] = system(
        acc.state,
        acc.messages,
        predicate,
        fn
      );
      return { state: newState, messages: [...acc.messages, ...newMessages] };
    },
    {
      state,
      messages
    }
  );

  return nextState.state;
}
