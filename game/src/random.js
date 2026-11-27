// A small seeded random number generator: the same seed gives the same game, which is
// what makes the screenshot scenes repeatable. SplitMix32: one 32-bit state word, advanced
// with a fixed odd increment and mixed with xorshift-multiply rounds.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function random() {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    z = z ^ (z >>> 15);
    return (z >>> 0) / 4294967296;
  };
}
