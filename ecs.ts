import * as _ from "lodash";
import regl from "regl";

import { Input, State, InputRequest } from "./common/interfaces";
import { step } from "./common/state";
import { FRAME } from "./common/clock";
import { initDrawing } from "./app/draw";
import { receiveUpdate } from "./app/replayFrames";
import { initialState } from "./common/initialState";
import { getCurrentScene } from "./common/scene";

/**
 * move player using arrow keys,
 * enemy follows player.
 * when they collide, take away player health
 */

// entity component system where entities are bags of components
// reduce systems that have similarity

const worker = new Worker("./worker.ts");

let clientId;
let frame = 0;
let state: State = initialState;
let savedFrames: {
  inputRequest: InputRequest;
  frame: number;
}[] = [];

worker.onmessage = e => {
  switch (e.data.type) {
    case "CLIENT_ID":
      clientId = e.data.clientId;
      break;

    case "STATE_UPDATE":
      const stateUpdate = receiveUpdate(
        state,
        e.data.players,
        e.data.acks,
        clientId,
        savedFrames
      );
      state = stateUpdate[0];
      savedFrames = stateUpdate[1];
      break;

    default:
      break;
  }
};

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
    switch (getCurrentScene(state)) {
      case "GAME":
        {
          const currentInput = { ...input };
          const inputRequest = { clientId, frame, input: currentInput };

          state = step(state, [inputRequest]);

          savedFrames.push({
            inputRequest,
            frame: frame
          });

          worker.postMessage({
            type: "SEND_FRAME",
            payload: { ...inputRequest }
          });

          frame += 1;

          throttledInputs.forEach(ti => {
            input[ti] = input[ti] ? false : input[ti];
          });
        }
        break;

      case "GAME_OVER":
        {
          console.log(
            "any state that needs to be managed in the game over scene happens here"
          );

          // when space is pressed, transition back to somewhere
        }

        break;
    }
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

    const currentScene = getCurrentScene(state);

    switch (currentScene) {
      case "GAME":
        draw.drawGame(state, clientId);
        break;

      case "GAME_OVER":
        draw.drawGameOver(state, clientId);
        break;
    }
  });
};
