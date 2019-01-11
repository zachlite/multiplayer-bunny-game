import * as _ from "lodash";
import { State, Entity } from "../common/interfaces";
import { step } from "../common/state";

export function receiveUpdate(
  state: State,
  players: Entity[],
  acks,
  clientId: string,
  savedFrames
) {
  let nextState = [...state];

  players.forEach(player => {
    // is this player already in local state?
    const i = nextState.findIndex(e => e.id === player.id);

    // if this player is not in local state, add the player
    // else, just update.
    if (i === -1) {
      nextState.push(player);
    } else {
      nextState[i] = player;
    }
  });

  // if there's an entity in local state that is no longer in server state, delete it.
  const playerIdsFromServer = players.map(e => e.id);
  nextState = nextState.filter(
    e => e.type !== "PLAYER" || _.includes(playerIdsFromServer, e.id)
  );

  // filter all saved frames sinces the ack
  const ackFrame: number = acks[clientId];
  const framesSinceAck = savedFrames.filter(sf => sf.frame > ackFrame);

  // replay all frames since the ack.
  framesSinceAck.forEach(sf => {
    nextState = step(nextState, [sf.inputRequest]);
  });

  // throw away ack frame.
  savedFrames = savedFrames.filter(sf => sf.frame !== ackFrame);

  return [nextState, savedFrames];
}
