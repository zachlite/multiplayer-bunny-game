import * as _ from "lodash";
import io from "socket.io-client";
import regl from "regl";

import { Input, State, InputRequest, MessageType } from "./common/interfaces";
import { step } from "./common/state";
import { FRAME, LATENCY } from "./common/clock";
import { initDrawing } from "./app/draw";
import { createMessage } from "./common/message";

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
let savedFrames: {
  state: State;
  inputRequest: InputRequest;
  frame: number;
}[] = [];
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
    state = step(state, [sf.inputRequest]);
  });

  // throw away ack frame.
  savedFrames = savedFrames.filter(sf => sf.frame !== ackFrame);
}

window.onload = () => {
  let keysPressed = {};

  // make sure space is only fired once per keydown event:
  // on initial keydown, set to true
  // immediately set to false if true
  // on next keydown, only set to true if not in keysPressed dict.

  let input: Input = {
    flap: false,
    left: false,
    right: false,
    forward: false,
    back: false
  };

  const keyCodeMappings = {
    flap: "Space",
    left: "KeyA",
    right: "KeyD",
    forward: "KeyW",
    back: "KeyS"
  };

  const throttledInputs = ["flap"];

  document.addEventListener("keydown", e => {
    Object.keys(input).forEach(i => {
      if (_.includes(throttledInputs, i) && keyCodeMappings[i] === e.code) {
        input[i] = !keysPressed[e.code] ? true : false;
      } else {
        input[i] = keyCodeMappings[i] === e.code ? true : input[i];
      }
    });

    keysPressed[e.code] = true;
  });

  document.addEventListener("keyup", e => {
    Object.keys(input).forEach(i => {
      input[i] = keyCodeMappings[i] === e.code ? false : input[i];
    });
    keysPressed[e.code] = undefined;
  });

  const canvas = document.getElementById("canvas");

  function gameLoop() {
    const currentInput = { ...input };
    const inputRequest = { clientId, frame, input: currentInput };
    send(inputRequest);
    state = step(state, [inputRequest]);
    savedFrames.push({ state, inputRequest, frame });
    frame += 1;

    throttledInputs.forEach(ti => {
      input[ti] = input[ti] ? false : input[ti];
    });
  }

  (function initGameClock(fn) {
    setInterval(fn, FRAME);
  })(gameLoop);

  const r = regl(canvas);
  const draw = initDrawing(r);

  r.frame(context => {
    r.clear({
      color: [0, 0, 0, 1],
      depth: 1
    });

    draw(state, clientId);
  });
};
