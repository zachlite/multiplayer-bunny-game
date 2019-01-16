import * as socketio from "socket.io";
import * as _ from "lodash";
import * as express from "express";
import * as path from "path";

import { FRAME, LATENCY } from "./common/clock";
import {
  InputRequest,
  State,
  MeshTypes,
  SceneManager
} from "./common/interfaces";
import { step } from "./common/state";
import { initPlayer } from "./common/player";
import { initialState } from "./common/initialState";
import { getCurrentScene } from "./common/scene";
import { clientName } from "./common/clientName";
const FRAME_BUFFER = 4; // wait 4 frames before processing input

const io = socketio(5555);

const PLAYERS_PER_PARTY = 4;

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

function createParty(): Party {
  return {
    id: _.uniqueId("party_"),
    state: [...initialState],
    partySize: 0,
    clientBuffer: [],
    clientSocketIds: {}
  };
}

function addClientToParty(party: Party, socket, clientId: string): Party {
  return {
    ...party,
    partySize: party.partySize + 1,
    clientSocketIds: {
      ...party.clientSocketIds,
      [socket.id]: clientId
    }
  };
}

function removeClientFromParty(party: Party, socket) {
  party.state = party.state.filter(
    e => e.id !== party.clientSocketIds[socket.id]
  );

  socket.leave(party.id);

  delete party.clientSocketIds[socket.id];
  party.partySize -= 1;

  if (party.partySize === 0) {
    parties = parties.filter(p => p.id !== party.id);
  }
}

function joinAvailableParty(socket, clientId) {
  const availableParty = parties.find(
    party =>
      party.partySize < PLAYERS_PER_PARTY &&
      party.state.find(e => e.type === "SCENE_MANAGER").sceneManager
        .currentScene === "LOBBY"
  );

  const party = availableParty ? availableParty : createParty();
  const partyWithClient = addClientToParty(party, socket, clientId);

  parties = availableParty
    ? parties.map(p => (p.id === party.id ? partyWithClient : p))
    : [...parties, partyWithClient];

  socket.join(partyWithClient.id);
  return partyWithClient;
}

io.on("connection", socket => {
  // get the first available party

  const clientId = clientName();
  console.log("client connected", socket.id);

  const party = joinAvailableParty(socket, clientId);

  // send it to the client
  socket.emit("welcome", { clientId });

  initPlayerForClient(clientId, party);

  socket.on("player_input", input => onReceiveInput(input, socket));
  socket.on("disconnect", () => onClientDisconnect(socket));
  socket.on("play_again", () => playAgain(socket));
});

/**
 * Server
 *
 * the server and client agree on a timestep
 * the server buffers client requests and processes them every 4 frames.
 * the server sends its state to all connected clients, including an ack for each client.
 */

// every 4 ticks, step

// don't try and keep people together
// when a player wants to play again, get an available party or make a new one

function initPlayerForClient(clientId: string, party: Party) {
  // get color for client and make color unavailable
  const colors = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1]];
  const color = colors[(party.partySize - 1) % 4];

  // create a player with this id
  party.state.push(initPlayer(clientId, MeshTypes.BUNNY, color));
}

function playAgain(socket) {
  const oldParty = getParty(socket);
  const clientId = oldParty.clientSocketIds[socket.id];
  const newParty = joinAvailableParty(socket, clientId);

  removeClientFromParty(oldParty, socket);
  initPlayerForClient(clientId, newParty);
}

function getParty(socket) {
  return parties.find(party => party.clientSocketIds[socket.id] !== undefined);
}

function onClientDisconnect(socket: socketio.Socket) {
  console.log("client disconnected", socket.id);

  let party = getParty(socket);
  removeClientFromParty(party, socket);
}

function onReceiveInput(input: InputRequest, socket) {
  let party = getParty(socket);

  setTimeout(() => {
    party.clientBuffer.push(input);
  }, LATENCY);
}

// make one of these for each party

function tick(party: Party): Party {
  switch (getCurrentScene(party.state)) {
    case "LOBBY": {
      // if the lobby has met the requisite number of players, update scene manager

      party.state = party.state.map(e =>
        e.type === "SCENE_MANAGER" && party.partySize === PLAYERS_PER_PARTY
          ? { ...e, sceneManager: { currentScene: "GAME" } as SceneManager }
          : e
      );
      return party;
    }

    case "GAME": {
      // process each client's input from the buffer
      const connectedClients = party.partySize;
      const inputRequestsChunks = _.chunk(party.clientBuffer, connectedClients);

      inputRequestsChunks.forEach(inputRequests => {
        party.state = step(party.state, inputRequests);
      });

      // clear the buffer
      return party;
    }

    default:
      return party;
  }
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
    updates: party.state.filter(
      e =>
        e.type === "PLAYER" || e.type === "TIMER" || e.type === "SCENE_MANAGER"
    ),
    acks
  });

  party.clientBuffer = [];
}

(() => {
  setInterval(() => {
    // tick for each party
    parties = parties.map(party => tick(party));

    // send updates for each party

    parties
      .filter(party => party.partySize > 0)
      .forEach(party => {
        updateClients(party);
      });
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
