import io from "socket.io-client";
import { LATENCY } from "./common/clock";
import { State, InputRequest } from "./common/interfaces";
import { step } from "./common/state";

// send and receive data on a separate thread.

const socket = io("http://localhost:5555");
let clientId;

socket.on("welcome", data => {
  clientId = data.clientId;
  postMessage({ type: "CLIENT_ID", clientId: data.clientId });
});

socket.on("update", ({ state, acks }) => {
  setTimeout(() => {
    const newState = receiveUpdate(state, acks);
    postMessage({ type: "STATE_UPDATE", newState });
  }, LATENCY);
});

// worker is responsible for managing savedFrames
// receive update here, send back new state.

let savedFrames: {
  inputRequest: InputRequest;
  frame: number;
}[] = [];

function receiveUpdate(serverState: State, acks) {
  // accept server state as truth.
  let state = serverState;
  // filter all saved frames sinces the ack
  const ackFrame: number = acks[clientId];
  const framesSinceAck = savedFrames.filter(sf => sf.frame > ackFrame);

  // replay all frames since the ack.
  framesSinceAck.forEach(sf => {
    state = step(state, [sf.inputRequest]);
  });

  // throw away ack frame.
  savedFrames = savedFrames.filter(sf => sf.frame !== ackFrame);
  return state;
}

onmessage = e => {
  switch (e.data.type) {
    case "SEND_FRAME":
      socket.emit("player_input", e.data.payload);
      savedFrames.push({
        inputRequest: e.data.payload,
        frame: e.data.payload.frame
      });
      break;
  }
};
