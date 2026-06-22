/**
 * Seeded pseudo-random number generator.
 *
 * Uses mulberry32 algorithm — fast, compact, good distribution.
 * Matches HDGEO's Random() / RandomSeed() API.
 */

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeededRandom {
  /** Returns a random float. 0 args → [0,1). 1 arg → [0,max). 2 args → [min,max). */
  random(min?: number, max?: number): number;
  /** Reset the PRNG with a new seed. */
  randomSeed(seed: number): void;
}

/**
 * Create a seeded random number generator.
 * If no seed is provided, uses a time-based seed.
 */
export function createRandom(seed?: number): SeededRandom {
  let rng = mulberry32(seed ?? (Date.now() ^ (Math.random() * 0xFFFFFFFF)));

  return {
    random(min?: number, max?: number): number {
      const v = rng();
      if (min === undefined) return v;
      if (max === undefined) return v * min;
      return min + v * (max - min);
    },

    randomSeed(s: number): void {
      rng = mulberry32(s);
    },
  };
}
