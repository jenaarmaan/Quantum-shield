/**
 * Cryptographic SHA-256 Digest Generator
 * Supports synchronous fallback for instant on-device calculation
 * and Web Crypto API where available.
 */

// Pure TypeScript SHA-256 implementation (synchronous, zero external dependency)
export function sha256Sync(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = bytes[lengthProperty] * 8;
  
  // Initial hash values (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19)
  const hash: number[] = [];
  // Round constants (first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
  const k: number[] = [];
  
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = true;
      }
      const frac = (candidate ** (1 / 3)) % 1;
      k[primeCounter] = (frac * maxWord) | 0;
      if (primeCounter < 8) {
        const hFrac = (candidate ** 0.5) % 1;
        hash[primeCounter] = (hFrac * maxWord) | 0;
      }
      primeCounter++;
    }
  }

  for (i = 0; i < bytes[lengthProperty]; i++) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  words[asciiBitLength >>> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >>> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = [];
  for (i = 0; i < words[lengthProperty]; i += 16) {
    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[j + i] | 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const bVal = (hash[i] >> (j * 8)) & 255;
      result += (bVal < 16 ? '0' : '') + bVal.toString(16);
    }
  }

  return result;
}
