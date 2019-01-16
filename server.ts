import * as socketio from "socket.io";
import * as _ from "lodash";
import * as express from "express";
import * as path from "path";

import {
  FRAME,
  LATENCY,
  PLAYERS_PER_PARTY,
  FRAME_BUFFER
} from "./common/constants";
import { InputRequest, MeshTypes, SceneManager } from "./common/interfaces";
import { step } from "./common/state";
import { initPlayer } from "./common/player";
import { getCurrentScene } from "./common/scene";
import { clientName } from "./common/clientName";
import { Party, PartyManager } from "./server/party";

const io = socketio(5555);
const pm = PartyManager();

io.on("connection", socket => {
  // get the first available party

  const clientId = clientName();
  console.log("client connected", socket.id);

  const party = pm.joinAvailableParty(socket, clientId);

  // send it to the client
  socket.emit("welcome", { clientId });

  initPlayerForClient(clientId, party);

  socket.on("player_input", input => onReceiveInput(input, socket));
  socket.on("disconnect", () => onClientDisconnect(socket));
  socket.on("play_again", () => playAgain(socket));
});

function initPlayerForClient(clientId: string, party: Party) {
  // get color for client and make color unavailable
  const colors = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1]];
  const color = colors[(party.partySize - 1) % 4];

  // create a player with this id
  party.state.push(initPlayer(clientId, MeshTypes.BUNNY, color));
}

function playAgain(socket) {
  const oldParty = pm.findParty(socket);
  const clientId = oldParty.clientSocketIds[socket.id];
  const newParty = pm.joinAvailableParty(socket, clientId);

  pm.removeClientFromParty(oldParty, socket);
  initPlayerForClient(clientId, newParty);
}

function onClientDisconnect(socket: socketio.Socket) {
  console.log("client disconnected", socket.id);
  pm.removeClientFromParty(pm.findParty(socket), socket);
}

function onReceiveInput(input: InputRequest, socket) {
  let party = pm.findParty(socket);

  setTimeout(() => {
    party.clientBuffer.push(input);
  }, LATENCY);
}

function tick(party: Party): Party {
  switch (getCurrentScene(party.state)) {
    case "LOBBY": {
      party.state = party.state.map(e =>
        e.type === "SCENE_MANAGER" && party.partySize === PLAYERS_PER_PARTY
          ? { ...e, sceneManager: { currentScene: "GAME" } as SceneManager }
          : e
      );
      return party;
    }

    case "GAME": {
      const inputRequestsChunks = _.chunk(party.clientBuffer, party.partySize);
      inputRequestsChunks.forEach(inputRequests => {
        party.state = step(party.state, inputRequests);
      });
      return party;
    }

    default:
      return party;
  }
}

function broadcastUpdates(party: Party) {
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
    pm.updateParties(tick);
    // send updates for each party
    pm.broadcastUpdates(broadcastUpdates);
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
