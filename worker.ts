import io from "socket.io-client";
import { LATENCY } from "./common/constants";

// send and receive data on a separate thread.
const hostname =
  process.env.NODE_ENV === "production" ? process.env.WS_HOST : "localhost";
const socket = io(`http://${hostname}:5555`);

socket.on("welcome", data => {
  postMessage({ type: "CLIENT_ID", clientId: data.clientId });
});

socket.on("update", ({ updates, acks }) => {
  setTimeout(() => {
    postMessage({ type: "STATE_UPDATE", updates, acks });
  }, LATENCY);
});

onmessage = e => {
  switch (e.data.type) {
    case "SEND_FRAME":
      socket.emit("player_input", e.data.payload);
      break;
    case "PLAY_AGAIN":
      socket.emit("play_again");
      break;
  }
};
