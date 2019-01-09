const seedrandom = require("seedrandom");
const seed = seedrandom(0);

// get random number between min and max inclusive
function random(min: number, max: number) {
  return seed.quick() * (max - min + 1) + min;
}

export default random;
