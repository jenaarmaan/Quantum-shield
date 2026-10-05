/**
 * Quantum Core: Gates, Bell Pairs, Teleportation & Measurement
 */

import { StateVector, Complex, SQRT2_INV, getPauliState } from './states';
import { DeterministicPRNG } from '../prng';

export function applyPauliX(psi: StateVector): StateVector {
  return new StateVector(psi.b, psi.a);
}

export function applyPauliY(psi: StateVector): StateVector {
  // Y = [[0, -i], [i, 0]]
  const a: Complex = { real: psi.b.imag, imag: -psi.b.real };
  const b: Complex = { real: -psi.a.imag, imag: psi.a.real };
  return new StateVector(a, b);
}

export function applyPauliZ(psi: StateVector): StateVector {
  return new StateVector(psi.a, { real: -psi.b.real, imag: -psi.b.imag });
}

export function applyHadamard(psi: StateVector): StateVector {
  return new StateVector(
    { real: (psi.a.real + psi.b.real) * SQRT2_INV, imag: (psi.a.imag + psi.b.imag) * SQRT2_INV },
    { real: (psi.a.real - psi.b.real) * SQRT2_INV, imag: (psi.a.imag - psi.b.imag) * SQRT2_INV }
  );
}

export function applyPauliCorrection(psi: StateVector, m1: number, m2: number): StateVector {
  let state = psi;
  if (m2 === 1) state = applyPauliX(state);
  if (m1 === 1) state = applyPauliZ(state);
  return state;
}

export interface TeleportationResult {
  m1: number;
  m2: number;
  initialState: StateVector;
  rawReceivedState: StateVector;
  correctedState: StateVector;
  fidelity: number;
}

export function simulateTeleportation(psi: StateVector, prng: DeterministicPRNG): TeleportationResult {
  // 4 Bell projection outcomes occur with equal probability 0.25
  const outcome = prng.nextInt(0, 3);
  const m1 = (outcome >> 1) & 1;
  const m2 = outcome & 1;

  let raw = psi;
  if (m2 === 1) raw = applyPauliX(raw);
  if (m1 === 1) raw = applyPauliZ(raw);

  const corrected = applyPauliCorrection(raw, m1, m2);
  const fidelity = psi.transitionProbability(corrected);

  return {
    m1,
    m2,
    initialState: psi,
    rawReceivedState: raw,
    correctedState: corrected,
    fidelity
  };
}

export function measureState(psi: StateVector, basis: string, prng: DeterministicPRNG): { bit: number; p0: number } {
  const state0 = getPauliState(basis, 0);
  const p0 = Math.max(0, Math.min(1, psi.transitionProbability(state0)));
  const roll = prng.next();
  const bit = roll < p0 ? 0 : 1;
  return { bit, p0 };
}
