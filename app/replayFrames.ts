import { State } from "../common/interfaces";
import { step } from "../common/state";

export function receiveUpdate(
  state: State,
  stateUpdate: State,
  acks,
  clientId: string,
  savedFrames
) {
  let nextState = [...state];

  stateUpdate.forEach(player => {
    // is this player already in local state?
    const i = nextState.findIndex(e => e.id === player.id);

    // if this player is not in local state, add the player
    if (i === -1) {
      // console.log("adding!");
      nextState.push(player);
    } else {
      // console.log("updating!");
      nextState[i] = player;
    }
  });

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
