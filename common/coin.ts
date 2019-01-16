import { MeshTypes, Entity } from "./interfaces";

export function makeCoin(cube: Entity) {
  const coin: Entity = {
    id: `coin-${cube.id}`,
    type: "COIN",
    isActive: true,
    mesh: { meshType: MeshTypes.TEAPOT },
    body: {
      useGravity: false,
      velocity: { x: 0, y: 0, z: 0 },
      transform: {
        position: {
          ...cube.body.transform.position,
          y: cube.body.transform.position.y + 10
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2, y: 2, z: 2 }
      }
    },
    collider: {
      position: {
        ...cube.body.transform.position,
        y: cube.body.transform.position.y + 10
      },
      scale: { x: 2, y: 2, z: 2 },
      isTrigger: true,
      isStatic: true,
      debug__activeCollision: false,
      debug__drawOutline: false
    },
    coin: { timeSinceDeactivation: 0 }
  };

  return coin;
}
