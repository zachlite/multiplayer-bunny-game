import * as socketio from "socket.io";
import * as _ from "lodash";
import * as express from "express";
import * as path from "path";

import { FRAME, LATENCY } from "./common/clock";
import { InputRequest, State, MeshTypes, Entity } from "./common/interfaces";
import { step } from "./common/state";
import { initPlayer } from "./common/player";
import { initialState } from "./common/initialState";
const FRAME_BUFFER = 4; // wait 4 frames before processing input

const io = socketio(5555);
io.on("connection", socket => {
  initClient(socket);
  socket.on("player_input", onReceiveInput);
  socket.on("disconnect", () => onClientDisconnect(socket));
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

let state: State = initialState;

let clientIds: { [socketId: string]: string } = {};

const colors = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1]];

function initClient(socket: socketio.Socket) {
  console.log("client connected", socket.id);

  // create a new clientId
  const clientId = _.uniqueId("client-");

  // send it to the client
  socket.emit("welcome", { clientId });

  // get color for client and make color unavailable
  const color = colors[(Object.keys(clientIds).length - 1) % 4];

  // create a player with this id
  state.push(initPlayer(clientId, MeshTypes.BUNNY, color));
  clientIds[socket.id] = clientId;
}

function onClientDisconnect(socket: socketio.Socket) {
  console.log("client disconnected", socket.id);
  state = state.filter(e => e.id !== clientIds[socket.id]);
  delete clientIds[socket.id];
}

function onReceiveInput(input: InputRequest) {
  setTimeout(() => {
    clientBuffer.push(input);
  }, LATENCY);
}

function tick() {
  // process each client's input from the buffer
  const connectedClients = Object.keys(clientIds).length;
  const inputRequestsChunks = _.chunk(clientBuffer, connectedClients);

  inputRequestsChunks.forEach(inputRequests => {
    state = step(state, inputRequests);
  });

  // need ack frames for each client
  const acks: { [clientId: string]: number } = clientBuffer.reduce(
    (prev, curr) => {
      return { ...prev, [curr.clientId]: curr.frame };
    },
    {}
  );

  // send state to all clients with ack
  // only send non-cube state

  io.emit("update", { players: state.filter(e => e.type === "PLAYER"), acks });

  // clear the buffer
  clientBuffer = [];
}

function initClock(tick) {
  setInterval(tick, FRAME * FRAME_BUFFER);
}

initClock(tick);

console.log("game server running..");

if (process.env.NODE_ENV === "production") {
  const app = express();
  app.use(express.static("dist"));
  app.get("/", (req, res) => {
    res.sendfile(path.join(__dirname, "../dist/index.html"));
  });
  app.listen("8000", () => console.log("http server listens.."));
}

["SIGINT", "SIGTERM"].forEach((signal: string) => {
  process.on(signal as any, () => {
    console.log("quitting", signal);
    process.exit();
  });
});
