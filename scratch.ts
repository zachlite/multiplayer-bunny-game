// const vAfterCollision = () => {
//   const a_or_b = collision.a.id === entity.id ? "a" : "b";
//   const vFunction =
//     a_or_b === "a" ? elasticCollision.v1 : elasticCollision.v2;

//   // assume mass is 1 for now
//   const m1 = 1;
//   const m2 = 1;

//   const u1 = a_or_b === "a" ? collision.a.velocity : collision.b.velocity;
//   const u2 = a_or_b === "a" ? collision.b.velocity : collision.a.velocity;

//   const x = vFunction(m1, m2, u1.x, u2.x);
//   const y = vFunction(m1, m2, u1.y, u2.y);
//   const z = vFunction(m1, m2, u1.z, u2.z);

//   return {x, y, z}
// };

// const velocity: Vec3 = collisions.reduce(
//   (v, collision: CollisionMessage) => {
//     // v is the initial velocity.  not from the message

//     // is this entity a or b?
//     const object = collision.a.id === entity.id ? "a" : "b";

//     // assume mass of 1 for now
//     const m1 = 1;
//     const m2 = 1;

//     const vFunc =
//       object === "a"
//         ? velocitiesAfterCollision.v1
//         : velocitiesAfterCollision.v2;

//     const u1 = collision.a.velocity;
//     const u2 = collision.b.velocity;

//     const vx = vFunc(m1, m2, u1.x, u2.x);
//     const vy = vFunc(m1, m2, u1.y, u2.y);
//     const vz = vFunc(m1, m2, u1.z, u2.z);

//     console.log("effects of collision for ", entity.id);
//     console.log("a: ", collision.a.id, "b: ", collision.b.id);

//     console.log({ vx, vy, vz });
//     console.log("____");

//     return {
//       x: vx,
//       y: vy,
//       z: vz
//     };
//   },
//   { ...entity.body.velocity }
// );

function teapotMovement(
  entity: Entity,
  messages: Message[]
): [Entity, Message[]] {
  const { velocity } = entity.body;
  const dx = velocity.x * FRAME;
  const dy = velocity.y * FRAME;
  const dz = velocity.z * FRAME; // things are so fast because this is in units of ms, not s.

  const clampV = {
    x: decay(velocity.x),
    y: decay(velocity.y),
    z: decay(velocity.z)
  };

  const { position } = entity.body.transform;
  const newPosition = {
    x: position.x + dx,
    y: position.y + dy,
    z: position.z + dz
  };
  const transform = { ...entity.body.transform, position: newPosition };
  const newEntity = {
    ...entity,
    body: { ...entity.body, transform, velocity: clampV }
  };

  return [newEntity, []];
}
