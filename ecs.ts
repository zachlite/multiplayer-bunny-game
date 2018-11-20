import * as _ from "lodash";
import io from "socket.io-client";
import regl from "regl";

import { Input, State, InputRequest } from "./common/interfaces";
import { step } from "./common/state";
import { FRAME, LATENCY } from "./common/clock";
import { getDraw } from "./app/draw";

/**
 * move player using arrow keys,
 * enemy follows player.
 * when they collide, take away player health
 */

// entity component system where entities are bags of components
// reduce systems that have similarity

const socket = io(`http://${window.location.hostname}:5555`);

let clientId;
let frame = 0;
let savedFrames: { state: State; inputMessages: any[]; frame: number }[] = [];
let state: State = [];

socket.on("welcome", data => {
  clientId = data.clientId;
  console.log(clientId);
});

socket.on("update", ({ state, acks }) => {
  setTimeout(() => receiveUpdate(state, acks), LATENCY);
});

function send(input: InputRequest) {
  socket.emit("player_input", input);
}

function receiveUpdate(serverState: State, acks) {
  // accept server state as truth.
  state = serverState;

  // filter all saved frames sinces the ack
  const ackFrame: number = acks[clientId];
  const framesSinceAck = savedFrames.filter(sf => sf.frame > ackFrame);

  // replay all frames since the ack.
  framesSinceAck.forEach(sf => {
    state = step(state, sf.inputMessages, clientId);
  });

  // throw away ack frame.
  savedFrames = savedFrames.filter(sf => sf.frame !== ackFrame);
}

window.onload = () => {
  let input: Input = { left: false, right: false };
  document.addEventListener("keydown", e => {
    input.left = e.code === "ArrowLeft" ? true : input.left;
    input.right = e.code === "ArrowRight" ? true : input.right;
  });

  document.addEventListener("keyup", e => {
    input.left = e.code === "ArrowLeft" ? false : input.left;
    input.right = e.code === "ArrowRight" ? false : input.right;
  });

  const canvas = document.getElementById("canvas");

  function gameLoop() {
    const currentInput = { ...input };
    const inputMessages = [{ type: "INPUT", data: currentInput }];
    send({ clientId, frame, input: currentInput });
    state = step(state, inputMessages, clientId);
    savedFrames.push({ state, inputMessages, frame });
    frame += 1;
  }

  (function initGameClock(fn) {
    setInterval(fn, FRAME);
  })(gameLoop);

  const r = regl(canvas);
  const draw = getDraw(r);

  r.frame(context => {
    r.clear({
      color: [0, 0, 0, 1],
      depth: 1
    });

    draw(state);
  });
};
