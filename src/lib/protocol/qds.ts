/**
 * Protocol Engine: Teleportation-based Quantum Digital Signature (QDS-v1.0)
 * Deterministic TypeScript implementation.
 */

import { StateVector, getPauliState } from '../quantum/states';
import { simulateTeleportation, measureState } from '../quantum/teleportation';
import { NoiseModel } from '../channel/noise';
import { sha256Sync } from './sha256';
import { DeterministicPRNG } from '../prng';

export interface KeyGenerationResult {
  nQubits: number;
  bases: string[];
  bits: number[];
  states: StateVector[];
  seed: number;
}

export interface DistributionResult {
  teleportedStates: StateVector[];
  averageFidelity: number;
  nQubits: number;
  seed: number;
}

export interface SignaturePacket {
  messageHash: string;
  messageBytesLen: number;
  nonce: string;
  timestamp: number;
  verifierId: string;
  protocolName: string;
  protocolVersion: string;
  declaredBases: string[];
  declaredBits: number[];
  nQubits: number;
}

export interface VerificationResult {
  mismatches: number;
  nVerified: number;
  qber: number;
  mismatchStream: number[];
  nonce: string;
  timestamp: number;
  verifierId: string;
  messageHash: string;
}

export class TeleportationQDSProtocol {
  readonly protocolName = 'Teleportation-QDS';
  readonly protocolVersion = 'QDS-v1.0';

  generateKeys(nQubits: number, seed: number): KeyGenerationResult {
    const prng = new DeterministicPRNG(seed);
    const basesPool = ['X', 'Y', 'Z'];
    const bases: string[] = [];
    const bits: number[] = [];
    const states: StateVector[] = [];

    for (let i = 0; i < nQubits; i++) {
      const b = prng.choice(basesPool);
      const k = prng.nextInt(0, 1);
      bases.push(b);
      bits.push(k);
      states.push(getPauliState(b, k));
    }

    return { nQubits, bases, bits, states, seed };
  }

  distributeKeys(
    keyData: KeyGenerationResult,
    noiseModel: NoiseModel,
    seed: number
  ): DistributionResult {
    const prng = new DeterministicPRNG(seed);
    const teleportedStates: StateVector[] = [];
    let fidelitySum = 0;

    for (const psi of keyData.states) {
      const tel = simulateTeleportation(psi, prng);
      const noisy = noiseModel.apply(tel.correctedState, prng);
      teleportedStates.push(noisy);
      fidelitySum += psi.transitionProbability(noisy);
    }

    return {
      teleportedStates,
      averageFidelity: fidelitySum / Math.max(1, keyData.states.length),
      nQubits: teleportedStates.length,
      seed
    };
  }

  sign(
    message: string,
    keyData: KeyGenerationResult,
    verifierId: string,
    seed: number,
    customNonce?: string,
    customTimestamp?: number
  ): SignaturePacket {
    const hash = sha256Sync(message);
    const nonce = customNonce ?? sha256Sync(`nonce:${seed}:${hash}`).slice(0, 32);
    const timestamp = customTimestamp ?? 1775376000.0;

    return {
      messageHash: hash,
      messageBytesLen: new TextEncoder().encode(message).length,
      nonce,
      timestamp,
      verifierId,
      protocolName: this.protocolName,
      protocolVersion: this.protocolVersion,
      declaredBases: [...keyData.bases],
      declaredBits: [...keyData.bits],
      nQubits: keyData.nQubits
    };
  }

  verify(
    sigPacket: SignaturePacket,
    receivedStates: StateVector[],
    seed: number
  ): VerificationResult {
    const prng = new DeterministicPRNG(seed);
    const bases = sigPacket.declaredBases;
    const declaredBits = sigPacket.declaredBits;
    const n = Math.min(bases.length, receivedStates.length);

    let mismatches = 0;
    const mismatchStream: number[] = [];

    for (let i = 0; i < n; i++) {
      const basis = bases[i];
      const expectedBit = declaredBits[i];
      const state = receivedStates[i];

      const { bit: measuredBit } = measureState(state, basis, prng);
      if (measuredBit !== expectedBit) {
        mismatches++;
        mismatchStream.push(1);
      } else {
        mismatchStream.push(0);
      }
    }

    return {
      mismatches,
      nVerified: n,
      qber: mismatches / Math.max(1, n),
      mismatchStream,
      nonce: sigPacket.nonce,
      timestamp: sigPacket.timestamp,
      verifierId: sigPacket.verifierId,
      messageHash: sigPacket.messageHash
    };
  }
}
