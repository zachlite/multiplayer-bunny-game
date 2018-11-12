import * as socketio from "socket.io";
import * as _ from "lodash";

import { FRAME } from "./common/clock";
import { InputRequest, State, initState } from "./common/interfaces";
import { step } from "./common/state";
const FRAME_BUFFER = 4; // wait 4 frames before processing input

const io = socketio(5555);

io.on("connection", socket => {
  console.log("client connected");

  socket.emit("welcome", { clientId: _.uniqueId("client-") });
  socket.on("player_input", onReceiveInput);

  socket.on("disconnect", () => {
    console.log("client disconnected");
  });
});

/**
 * Server
 *
 * the server and client agree on a timestep
 * the server buffers client requests and processes them every 4 frames.
 * the server sends its state to all connected clients, including an ack for each client.
 */

// every 4 ticks, step

let clientBuffer: InputRequest[] = [];

let state: State = initState();

function onReceiveInput(input: InputRequest) {
  clientBuffer.push(input);
}

function updateClients({ state, acks }) {
  io.emit("update", { state, acks });
}

function tick() {
  // process each client's input from the buffer

  clientBuffer.forEach(request => {
    const inputMessages = [{ type: "INPUT", data: request.input }];
    state = step(state, inputMessages);
  });

  // need ack frames for each client
  const acks: { [clientId: string]: number } = clientBuffer.reduce(
    (prev, curr) => {
      return { ...prev, [curr.clientId]: curr.frame };
    },
    {}
  );

  // send state to all clients with ack
  updateClients({ state, acks });

  // clear the buffer
  clientBuffer = [];
}

function initClock(tick) {
  setInterval(tick, FRAME * FRAME_BUFFER);
}

initClock(tick);

console.log("server listens..");
