/**
 * Deterministic Pseudo-Random Number Generator (PRNG)
 * Ensures reproducible simulations on-device and in test environments.
 */

export class DeterministicPRNG {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 1;
  }

  /**
   * Mulberry32 algorithm: 32-bit generator with excellent statistical distribution
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(items: T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }
}
