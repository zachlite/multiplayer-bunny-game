import * as socketio from "socket.io";
import * as _ from "lodash";
import * as express from "express";
import * as path from "path";

import { FRAME, LATENCY } from "./common/clock";
import { InputRequest, State, MeshTypes, Entity } from "./common/interfaces";
import { step } from "./common/state";
import { initPlayer } from "./common/player";
import { initialState } from "./common/initialState";
import { getCurrentScene } from "./common/scene";
const FRAME_BUFFER = 4; // wait 4 frames before processing input

const io = socketio(5555);

const PLAYERS_PER_PARTY = 2;

interface Party {
  id: string;
  partySize: number;
  state: State;
  clientBuffer: InputRequest[];
  clientSocketIds: {
    [id: string]: string;
  };
}

let parties: Party[] = [];

io.on("connection", socket => {
  // get the first available party
  const availableParty = parties.find(
    party => party.partySize < PLAYERS_PER_PARTY
  );

  const clientId = _.uniqueId("client-");

  const party = availableParty
    ? {
        ...availableParty,
        partySize: availableParty.partySize + 1,
        clientSocketIds: {
          ...availableParty.clientSocketIds,
          [socket.id]: clientId
        }
      }
    : {
        id: _.uniqueId("party_"),
        state: initialState,
        partySize: 1,
        clientBuffer: [],
        clientSocketIds: {
          [socket.id]: clientId
        }
      };

  parties = availableParty
    ? parties.map(p => (p.id === party.id ? party : p))
    : [...parties, party];

  socket.join(party.id, () => {
    initClient(socket, clientId);
  });

  console.log(party.id);

  // a new client has joined the party

  socket.on("player_input", input => onReceiveInput(input, socket));
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

function getParty(socket) {
  return parties.find(party => party.clientSocketIds[socket.id] !== undefined);
}

function initClient(socket: socketio.Socket, clientId) {
  console.log("client connected", socket.id);

  // send it to the client
  socket.emit("welcome", { clientId });

  let party = getParty(socket);
  console.log(socket.rooms);

  // get color for client and make color unavailable
  const colors = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1]];
  const color = colors[(party.partySize - 1) % 4];

  // create a player with this id
  party.state.push(initPlayer(clientId, MeshTypes.BUNNY, color));
}

function onClientDisconnect(socket: socketio.Socket) {
  console.log("client disconnected", socket.id);

  let party = getParty(socket);

  party.state = party.state.filter(
    e => e.id !== party.clientSocketIds[socket.id]
  );

  delete party.clientSocketIds[socket.id];
  party.partySize -= 1;
  console.log(parties);
}

function onReceiveInput(input: InputRequest, socket) {
  let party = getParty(socket);

  setTimeout(() => {
    party.clientBuffer.push(input);
  }, LATENCY);
}

// make one of these for each party

function tick(party: Party): Party {
  if (getCurrentScene(party.state) !== "GAME") return party;

  // process each client's input from the buffer
  const connectedClients = party.partySize;
  const inputRequestsChunks = _.chunk(party.clientBuffer, connectedClients);

  inputRequestsChunks.forEach(inputRequests => {
    party.state = step(party.state, inputRequests);
  });

  // clear the buffer
  party.clientBuffer = [];
  return party;
}

function updateClients(party: Party) {
  // need ack frames for each client
  const acks: { [clientId: string]: number } = party.clientBuffer.reduce(
    (prev, curr) => {
      return { ...prev, [curr.clientId]: curr.frame };
    },
    {}
  );

  // send state to all clients with ack
  // only send non-cube state

  io.in(party.id).emit("update", {
    players: party.state.filter(e => e.type === "PLAYER"),
    acks
  });
}

(() => {
  setInterval(() => {
    // tick for each party
    // parties = parties.map
    parties = parties.map(party => tick(party));

    parties
      .filter(party => party.partySize > 0)
      .forEach(party => {
        updateClients(party);
      });

    // send updates for each party
  }, FRAME * FRAME_BUFFER);
})();

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
