import * as _ from "lodash";
import { Entity, MeshTypes, State } from "./interfaces";
import random from "./random";
import { makeCoin } from "./coin";
import { FRAME } from "./clock";

const cubes = _.range(50)
  .map(i => {
    return {
      x: random(-100, 100),
      y: random(5, 100),
      z: random(-100, 100)
    };
  })
  .map((position, i) => {
    const cube: Entity = {
      id: `cube-${i}`,
      isActive: true,
      type: "CUBE",
      mesh: { meshType: MeshTypes.CUBE },
      body: {
        useGravity: false,
        velocity: { x: 0, y: 0, z: 0 },
        transform: {
          position: position,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 5, y: 5, z: 5 }
        }
      },
      collider: {
        position: position,
        scale: { x: 5, y: 5, z: 5 },
        isTrigger: false,
        isStatic: true,
        debug__activeCollision: false,
        debug__drawOutline: false
      }
    };

    return cube;
  });

const ground: Entity = {
  id: "ground",
  isActive: true,
  mesh: { meshType: MeshTypes.GROUND },
  body: {
    useGravity: false,
    velocity: { x: 0, y: 0, z: 0 },
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 200, y: 0, z: 200 }
    }
  },
  collider: {
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 200, y: 0, z: 200 },
    isTrigger: false,
    isStatic: true,
    debug__activeCollision: false,
    debug__drawOutline: true
  }
};

const dummy: Entity = {
  id: "dummy",
  isActive: true,
  mesh: { meshType: MeshTypes.TEAPOT },
  body: {
    useGravity: false,
    velocity: { x: 0, y: 0, z: 0 },
    transform: {
      position: { x: 0, y: 10, z: -30 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 10, y: 10, z: 10 }
    }
  }
};

const coins = cubes.map(makeCoin);

const timer: Entity = {
  id: "timer",
  type: "TIMER",
  isActive: true,
  timer: {
    lastTime: 0,
    timeRemaining: 60 * 1000 // milliseconds
  }
};

const sceneManager: Entity = {
  id: "scene-manager",
  type: "SCENE_MANAGER",
  isActive: true,
  sceneManager: { currentScene: "GAME" }
};

export const initialState: State = [
  ...cubes,
  ground,
  dummy,
  ...coins,
  timer,
  sceneManager
];
