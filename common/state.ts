import * as _ from "lodash";
import { Entity, State, Transform, Input, EntityType } from "./interfaces";

interface Message {
  type: string;
  data: any;
}

interface Logic
  extends Array<
    [
      (e: Entity) => boolean,
      (entity: Entity, messages: Message[]) => [Entity, Message[]]
    ]
  > {}

function collisionSystem(state: State): Message[] {
  // find entities with transforms that overlap
  const overlaps = (r1: Transform, r2: Transform) => {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  };

  const withTransform = state.filter(entity => entity.transform);
  const messages = _.flatten(
    withTransform.map(entity1 => {
      return withTransform.map(entity2 => {
        if (entity1.id === entity2.id) return null;

        return overlaps(entity1.transform, entity2.transform)
          ? { type: "COLLISION", data: { a: entity1.id, b: entity2.id } }
          : null;
      });
    })
  ).filter(m => m);

  return messages;
}

function enemyMovement(
  entity: Entity,
  messages: Message[]
): [Entity, Message[]] {
  // move towards player.

  // if the player moves, update follow.destination
  const playerMovedMessage = messages.filter(
    message => message.type === "PLAYER_MOVED"
  );

  const destination: { x: number; y: number } = playerMovedMessage.length
    ? playerMovedMessage[0].data.position
    : entity.follow.destination;

  // update transform according to follow.destination
  const { x, y } = destination;
  const transform = { ...entity.transform, x: x + 30, y };
  return [{ ...entity, transform, follow: { destination: { x, y } } }, []];
}

function playerMovement(
  entity: Entity,
  messages: Message[]
): [Entity, Message[]] {
  const input: any = _.first(
    messages.filter(message => message.type === "INPUT")
  ).data;

  const x = input.left
    ? entity.transform.x - 1
    : input.right
    ? entity.transform.x + 1
    : entity.transform.x;

  const transform = { ...entity.transform, x };

  const newMessages =
    input.left || input.right
      ? [
          {
            type: "PLAYER_MOVED",
            data: { position: { x: transform.x, y: transform.y } }
          }
        ]
      : [];

  const newEntity = { ...entity, transform };
  return [newEntity, newMessages];
}

function playerHealth(
  entity: Entity,
  messages: Message[]
): [Entity, Message[]] {
  const collisions = messages.filter(
    message =>
      message.type === "COLLISION" &&
      (message.data.a === entity.id || message.data.b === entity.id)
  );

  const health = collisions.reduce((acc, curr) => {
    return acc - 1;
  }, entity.health.amount);

  return [{ ...entity, health: { amount: health } }, []];
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
  const messages = [...inputMessages, ...collisionSystem(state)];

  const logic: Logic = [
    [(e: Entity) => e.id === clientId, playerMovement],
    [(e: Entity) => e.health !== undefined, playerHealth],
    [(e: Entity) => e.follow !== undefined, enemyMovement]
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
