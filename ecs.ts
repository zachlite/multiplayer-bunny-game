import * as _ from "lodash";
import io from "socket.io-client";
import { Input, State, initState, InputRequest } from "./common/interfaces";
import { step } from "./common/state";
import { FRAME } from "./common/clock";

/**
 * move player using arrow keys,
 * enemy follows player.
 * when they collide, take away player health
 */

// entity component system where entities are bags of components
// reduce systems that have similarity

const LATENCY = 30; //ms, one-way

const socket = io("http://localhost:5555");

let clientId;
let frame = 0;

socket.on("welcome", data => {
  clientId = data.clientId;
});

socket.on("update", ({ state, acks }) => {
  setTimeout(() => receiveUpdate(state, acks), LATENCY);
});

function send(input: InputRequest) {
  setTimeout(() => {
    socket.emit("player_input", input);
  }, LATENCY);
}

function receiveUpdate(state: State, acks) {
  console.log(state, acks);
}

window.onload = () => {
  let state: State = initState();

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
  const ctx = canvas.getContext("2d");

  function gameLoop() {
    const inputMessages = [{ type: "INPUT", data: input }];
    send({ clientId, frame, input });
    state = step(state, inputMessages);
    frame += 1;
  }

  (function initGameClock(fn) {
    setInterval(fn, FRAME);
  })(gameLoop);

  (function drawLoop() {
    draw(ctx, state);
    requestAnimationFrame(drawLoop);
  })();
};

function draw(ctx, state: State) {
  ctx.clearRect(0, 0, 640, 480);

  // draw everything with a transform
  state
    .filter(entity => entity.transform)
    .forEach(entity => {
      ctx.fillStyle = entity.color;
      ctx.fillRect(
        entity.transform.x,
        entity.transform.y,
        entity.transform.width,
        entity.transform.height
      );
    });

  ctx.fillStyle = "black";
  ctx.font = "12px sans-serif";
  ctx.fillText(
    `player health: ${_.sum(
      state.filter(e => e.health).map(e => e.health.amount)
    )}`,
    50,
    100
  );
}
