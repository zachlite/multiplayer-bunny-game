import io from "socket.io-client";
import { LATENCY } from "./common/clock";

// send and receive data on a separate thread.

const socket = io("http://localhost:5555");

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
