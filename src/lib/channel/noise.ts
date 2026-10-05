/**
 * Channel Engine: Quantum Noise & Calibration
 */

import { StateVector, getPauliState } from '../quantum/states';
import { applyPauliX, applyPauliY, applyPauliZ, measureState } from '../quantum/teleportation';
import { DeterministicPRNG } from '../prng';

export type NoiseModelType = 'depolarizing' | 'bit_flip' | 'phase_flip' | 'none';

export class NoiseModel {
  readonly modelType: NoiseModelType;
  readonly rate: number;

  constructor(modelType: NoiseModelType = 'depolarizing', rate: number = 0.02) {
    this.modelType = modelType;
    this.rate = Math.max(0, Math.min(1, rate));
  }

  apply(psi: StateVector, prng: DeterministicPRNG): StateVector {
    if (this.modelType === 'none' || this.rate <= 0) {
      return psi;
    }

    const roll = prng.next();
    if (this.modelType === 'depolarizing') {
      if (roll < this.rate) {
        const subRoll = prng.next();
        if (subRoll < 1 / 3) return applyPauliX(psi);
        if (subRoll < 2 / 3) return applyPauliY(psi);
        return applyPauliZ(psi);
      }
      return psi;
    }

    if (this.modelType === 'bit_flip') {
      if (roll < this.rate) return applyPauliX(psi);
      return psi;
    }

    if (this.modelType === 'phase_flip') {
      if (roll < this.rate) return applyPauliZ(psi);
      return psi;
    }

    return psi;
  }

  theoreticalP0(): number {
    if (this.modelType === 'none' || this.rate <= 0) return 0;
    return (2 / 3) * this.rate;
  }
}

export function wilsonScoreInterval(k: number, n: number, confidence: number = 0.95): {
  pHat: number;
  ciLower: number;
  ciUpper: number;
} {
  if (n <= 0) return { pHat: 0, ciLower: 0, ciUpper: 0 };
  const pHat = k / n;
  const z = Math.abs(confidence - 0.95) < 0.01 ? 1.95996 : 2.57583;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (pHat + z2 / (2 * n)) / denom;
  const margin = (z * Math.sqrt((pHat * (1 - pHat) / n) + (z2 / (4 * n * n)))) / denom;

  return {
    pHat,
    ciLower: Math.max(0, center - margin),
    ciUpper: Math.min(1, center + margin)
  };
}

export function calibrateChannel(
  noise: NoiseModel,
  nTrials: number = 1000,
  seed: number = 42
): {
  noiseModel: NoiseModelType;
  noiseRate: number;
  sampleSize: number;
  mismatches: number;
  p0Empirical: number;
  p0Theoretical: number;
  ciLower: number;
  ciUpper: number;
} {
  const prng = new DeterministicPRNG(seed);
  const bases = ['X', 'Y', 'Z'];
  let mismatches = 0;

  for (let i = 0; i < nTrials; i++) {
    const basis = prng.choice(bases);
    const bit = prng.nextInt(0, 1);
    const initial = getPauliState(basis, bit);
    const noisy = noise.apply(initial, prng);
    const { bit: measuredBit } = measureState(noisy, basis, prng);
    if (measuredBit !== bit) {
      mismatches++;
    }
  }

  const ci = wilsonScoreInterval(mismatches, nTrials);
  return {
    noiseModel: noise.modelType,
    noiseRate: noise.rate,
    sampleSize: nTrials,
    mismatches,
    p0Empirical: ci.pHat,
    p0Theoretical: noise.theoreticalP0(),
    ciLower: ci.ciLower,
    ciUpper: ci.ciUpper
  };
}
