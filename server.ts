import * as socketio from "socket.io";
import * as _ from "lodash";
import * as express from "express";
import * as path from "path";

import { FRAME, LATENCY } from "./common/clock";
import {
  InputRequest,
  State,
  MeshTypes,
  Entity,
  MessageType
} from "./common/interfaces";
import { step } from "./common/state";
import { initPlayer } from "./common/player";
import { createMessage } from "./common/message";
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

let state: State = [];

// let's create a ground and render it
const ground: Entity = {
  id: "ground",
  mesh: { meshType: MeshTypes.GROUND },
  body: {
    velocity: { x: 0, y: 0, z: 0 },
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 200, y: 0, z: 200 }
    }
  },
  collider: {
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 200, y: 0, z: 200 },
    isTrigger: false,
    isStatic: true,
    debug__activeCollision: false,
    debug__drawOutline: true
  }
};

const dummy: Entity = {
  id: "dummy",
  mesh: { meshType: MeshTypes.TEAPOT },
  body: {
    velocity: { x: 0, y: 0, z: 0 },
    transform: {
      position: { x: 0, y: 10, z: -30 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 10, y: 10, z: 10 }
    }
  }
};

// [
//   { x: 50, y: 5, z: -20 },
//   { x: 65, y: 5, z: -25 },
//   {
//     x: 65,
//     y: 15,
//     z: -25
//   }
// ]
const cubes = _.range(0)
  .map(i => {
    return { x: _.random(-100, 100), y: _.random(100), z: _.random(-100, 100) };
  })
  .map((position, i) => {
    const cube: Entity = {
      id: `cube-${i}`,
      mesh: { meshType: MeshTypes.CUBE },
      body: {
        velocity: { x: 0, y: 0, z: 0 },
        transform: {
          position: position,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 5, y: 5, z: 5 }
        }
      },
      collider: {
        position: position,
        scale: { x: 5, y: 5, z: 5 },
        isTrigger: false,
        isStatic: true,
        debug__activeCollision: false,
        debug__drawOutline: true
      }
    };

    return cube;
  });

const trigger: Entity = {
  id: "trigger",
  mesh: { meshType: MeshTypes.TRIGGER },
  collider: {
    position: { x: -50, y: 5, z: -30 },
    scale: { x: 2, y: 2, z: 2 },
    isTrigger: true,
    isStatic: true,
    debug__activeCollision: false,
    debug__drawOutline: true
  }
};

cubes.forEach(cube => {
  state.push(cube);
});
state.push(ground);
state.push(dummy);
state.push(trigger);

let clientIds: { [socketId: string]: string } = {};

// when a client connects, create a player for them.
// the client will receive this on the next state update.

function initClient(socket: socketio.Socket) {
  console.log("client connected", socket.id);

  // create a new clientId
  const clientId = _.uniqueId("client-");

  // send it to the client
  socket.emit("welcome", { clientId });

  // create a player with this id
  state.push(initPlayer(clientId, MeshTypes.BUNNY));
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

function updateClients({ state, acks }) {
  io.emit("update", { state, acks });
}

function tick() {
  // process each client's input from the buffer

  clientBuffer.forEach(request => {
    const inputMessages = [
      createMessage(MessageType.INPUT, { input: request.input })
    ];
    state = step(state, inputMessages, request.clientId);
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
