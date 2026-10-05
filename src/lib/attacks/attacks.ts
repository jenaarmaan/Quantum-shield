/**
 * Attack Engine: Attack Models in TypeScript
 */

import { StateVector, getPauliState } from '../quantum/states';
import { measureState } from '../quantum/teleportation';
import { DeterministicPRNG } from '../prng';

export type AttackType =
  | 'none'
  | 'forgery'
  | 'impersonation'
  | 'replay'
  | 'unauthorized_verification'
  | 'intercept_resend'
  | 'stealth';

export class AttackEngine {
  static applyForgery(
    states: StateVector[],
    prng: DeterministicPRNG
  ): StateVector[] {
    const basesPool = ['X', 'Y', 'Z'];
    return states.map(() => {
      const b = prng.choice(basesPool);
      const k = prng.nextInt(0, 1);
      return getPauliState(b, k);
    });
  }

  static applyImpersonation(
    states: StateVector[],
    prng: DeterministicPRNG
  ): StateVector[] {
    return states.map(() => {
      const b = prng.choice(['X', 'Z']);
      const k = prng.nextInt(0, 1);
      return getPauliState(b, k);
    });
  }

  static applyInterceptResend(
    states: StateVector[],
    strength: number,
    prng: DeterministicPRNG
  ): StateVector[] {
    const f = Math.max(0, Math.min(1, strength));
    const basesPool = ['X', 'Y', 'Z'];

    return states.map(psi => {
      if (prng.next() < f) {
        const measBasis = prng.choice(basesPool);
        const { bit } = measureState(psi, measBasis, prng);
        return getPauliState(measBasis, bit);
      }
      return psi;
    });
  }

  static applyStealthAttack(
    states: StateVector[],
    thresholdRate: number,
    p0: number,
    prng: DeterministicPRNG
  ): { modifiedStates: StateVector[]; actualStrength: number } {
    const margin = 0.01;
    const fSafe = 3.0 * Math.max(0, thresholdRate - p0 - margin);
    const actualStrength = Math.max(0, Math.min(0.95, fSafe * (0.85 + 0.25 * prng.next())));
    const modifiedStates = AttackEngine.applyInterceptResend(states, actualStrength, prng);
    return { modifiedStates, actualStrength };
  }
}
