import io from "socket.io-client";
import { LATENCY } from "./common/clock";

// send and receive data on a separate thread.
const hostname = process.env.WS_HOST || "localhost";
const socket = io(`http://${hostname}:5555`);

socket.on("welcome", data => {
  postMessage({ type: "CLIENT_ID", clientId: data.clientId });
});

socket.on("update", ({ state, acks }) => {
  setTimeout(() => {
    postMessage({ type: "STATE_UPDATE", state, acks });
  }, LATENCY);
});

onmessage = e => {
  switch (e.data.type) {
    case "SEND_FRAME":
      socket.emit("player_input", e.data.payload);
      break;
  }
};
