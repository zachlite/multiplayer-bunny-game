import * as _ from "lodash";
import { Entity, MeshTypes, State } from "./interfaces";
import random from "./random";

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

const trigger: Entity = {
  id: "trigger",
  mesh: { meshType: MeshTypes.TRIGGER },
  collider: {
    position: { x: -50, y: 5, z: -30 },
    scale: { x: 2, y: 2, z: 2 },
    isTrigger: true,
    isStatic: true,
    debug__activeCollision: false,
    debug__drawOutline: true
  }
};

export const initialState: State = [...cubes, ground, dummy, trigger];
