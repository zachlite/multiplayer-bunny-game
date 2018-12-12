const CR = 0.75; // coefficient of restitution.  1 = elastic, 0 = inelastic

export const velocitiesAfterCollision = {
  v1: (m1: number, m2: number, u1: number, u2: number, Cr: number = CR) =>
    (Cr * m2 * (u2 - u1) + m1 * u1 + m2 * u2) / (m1 + m2),

  v2: (m1: number, m2: number, u1: number, u2: number, Cr: number = CR) =>
    (Cr * m1 * (u1 - u2) + m1 * u1 + m2 * u2) / (m1 + m2)
};

export const decay = (v: number) => (Math.abs(v) < 0.00001 ? 0 : v * 0.99);
