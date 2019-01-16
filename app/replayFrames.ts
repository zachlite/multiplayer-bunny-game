import * as _ from "lodash";
import { State, Entity } from "../common/interfaces";
import { step } from "../common/state";
import { getCurrentScene } from "../common/scene";

export function receiveUpdate(
  state: State,
  updates: Entity[],
  acks,
  clientId: string,
  savedFrames
) {
  let nextState = [...state];

  updates.forEach(entity => {
    // is this entity already in local state?
    const i = nextState.findIndex(e => e.id === entity.id);

    // if this entity is not in local state, add the entity
    // else, just update the entity.
    if (i === -1) {
      nextState.push(entity);
    } else {
      nextState[i] = entity;
    }
  });

  // if there's an entity in local state that is not in server state, delete it.
  const entityIdsFromServer = updates.map(e => e.id);
  nextState = nextState.filter(
    e => e.type !== "PLAYER" || _.includes(entityIdsFromServer, e.id)
  );

  switch (getCurrentScene(nextState)) {
    case "GAME": {
      // filter all saved frames sinces the ack
      const ackFrame: number = acks[clientId];
      const framesSinceAck = savedFrames.filter(sf => sf.frame > ackFrame);

      console.log(framesSinceAck, acks);

      // replay all frames since the ack.
      framesSinceAck.forEach(sf => {
        nextState = step(nextState, [sf.inputRequest]);
      });

      // throw away ack frame.
      savedFrames = savedFrames.filter(sf => sf.frame !== ackFrame);
      return [nextState, savedFrames];
    }

    default:
      return [nextState, savedFrames];
  }
}
