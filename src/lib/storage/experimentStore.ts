/**
 * Experiment Store: Manages active experiment, audit chain, demo dataset, and history
 */

import { DecisionEvaluationResult } from '../detection/decision';
import { AuditChainManager, AuditRecordItem } from '../audit/auditChain';
import { sha256Sync } from '../protocol/sha256';
import { TeleportationQDSProtocol } from '../protocol/qds';
import { NoiseModel, calibrateChannel } from '../channel/noise';
import { AttackEngine, AttackType } from '../attacks/attacks';
import { RegistryManager } from '../registry/registry';
import { DecisionEngine } from '../detection/decision';
import { DeterministicPRNG } from '../prng';

export interface StoredExperiment {
  experimentId: string;
  timestamp: string;
  config: {
    message: string;
    protocol: string;
    protocolVersion: string;
    nQubits: number;
    noiseModel: 'depolarizing' | 'bit_flip' | 'phase_flip' | 'none';
    noiseRate: number;
    attackType: AttackType;
    attackStrength: number;
    alpha: number;
    beta: number;
    verifierId: string;
    seed: number;
  };
  results: DecisionEvaluationResult;
  auditRecord: AuditRecordItem;
  status: 'THEORETICAL' | 'SIMULATED' | 'EMPIRICALLY_VALIDATED';
}

export class ExperimentService {
  private auditChain: AuditChainManager;
  private registryManager: RegistryManager;
  private protocol: TeleportationQDSProtocol;
  private experiments: StoredExperiment[] = [];

  constructor() {
    this.auditChain = new AuditChainManager();
    this.registryManager = new RegistryManager();
    this.protocol = new TeleportationQDSProtocol();
    this.seedInitialExperiments();
  }

  getAuditChain(): AuditChainManager {
    return this.auditChain;
  }

  getRegistryManager(): RegistryManager {
    return this.registryManager;
  }

  getExperiments(): StoredExperiment[] {
    return [...this.experiments];
  }

  getExperimentById(id: string): StoredExperiment | undefined {
    return this.experiments.find(e => e.experimentId === id);
  }

  runSimulation(params: {
    message: string;
    nQubits?: number;
    noiseModel?: 'depolarizing' | 'bit_flip' | 'phase_flip' | 'none';
    noiseRate?: number;
    attackType?: AttackType;
    attackStrength?: number;
    alpha?: number;
    beta?: number;
    verifierId?: string;
    seed?: number;
    experimentId?: string;
    customNonce?: string;
    customTimestamp?: number;
  }): StoredExperiment {
    const nQubits = Math.max(16, Math.min(50000, params.nQubits ?? 1000));
    const noiseModelName = params.noiseModel ?? 'depolarizing';
    const noiseRate = Math.max(0, Math.min(0.5, params.noiseRate ?? 0.02));
    const attackType = params.attackType ?? 'none';
    const attackStrength = Math.max(0, Math.min(1, params.attackStrength ?? 0.20));
    const alpha = params.alpha ?? 1e-4;
    const beta = params.beta ?? 1e-4;
    let verifierId = params.verifierId ?? 'verifier_bob';
    const seed = params.seed ?? 1337;
    const expId = params.experimentId ?? `exp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const prng = new DeterministicPRNG(seed);
    const noise = new NoiseModel(noiseModelName, noiseRate);

    // 1. Channel Calibration
    const calib = calibrateChannel(noise, Math.min(500, nQubits), seed + 1);
    const p0 = calib.p0Empirical > 0 ? calib.p0Empirical : noise.theoreticalP0();

    // 2. Key Generation & Distribution via Teleportation
    const keyData = this.protocol.generateKeys(nQubits, seed);
    const dist = this.protocol.distributeKeys(keyData, noise, seed + 2);

    // 3. Attack Simulation
    let modifiedStates = [...dist.teleportedStates];
    let customNonce = params.customNonce;
    let actualStrength = attackStrength;

    if (attackType === 'forgery') {
      modifiedStates = AttackEngine.applyForgery(modifiedStates, prng);
    } else if (attackType === 'impersonation') {
      modifiedStates = AttackEngine.applyImpersonation(modifiedStates, prng);
    } else if (attackType === 'intercept_resend') {
      modifiedStates = AttackEngine.applyInterceptResend(modifiedStates, attackStrength, prng);
    } else if (attackType === 'stealth') {
      const stealthRes = AttackEngine.applyStealthAttack(modifiedStates, p0 + 0.05, p0, prng);
      modifiedStates = stealthRes.modifiedStates;
      actualStrength = stealthRes.actualStrength;
    } else if (attackType === 'replay') {
      if (!customNonce) {
        customNonce = `replayed_token_${seed}`;
        this.registryManager.registerNonce(customNonce, 'prior_captured_exp');
      }
    } else if (attackType === 'unauthorized_verification') {
      verifierId = 'unregistered_external_actor';
    }

    // 4. Signing & Verification
    const sig = this.protocol.sign(
      params.message,
      keyData,
      verifierId,
      seed + 4,
      customNonce,
      params.customTimestamp
    );

    const verify = this.protocol.verify(sig, modifiedStates, seed + 5);

    // 5. Classical Registry Check
    const reg = this.registryManager.checkAndRegister(
      sig.nonce,
      sig.timestamp,
      sig.verifierId,
      expId,
      sig.timestamp
    );

    // 6. Deterministic Decision Engine
    const decision = DecisionEngine.evaluate({
      mismatches: verify.mismatches,
      nQubits: verify.nVerified,
      p0,
      alpha,
      beta,
      registryRes: reg,
      mismatchStream: verify.mismatchStream,
      attackHint: attackType,
      experimentId: expId
    });

    // 7. Audit Block Creation
    const configPayload = {
      message: params.message,
      protocol: this.protocol.protocolName,
      protocolVersion: this.protocol.protocolVersion,
      nQubits,
      noiseModel: noiseModelName,
      noiseRate,
      attackType,
      attackStrength: actualStrength,
      alpha,
      beta,
      verifierId,
      seed
    };

    const configHash = sha256Sync(JSON.stringify(configPayload));
    const resultHash = sha256Sync(JSON.stringify(decision));

    const auditRecord = this.auditChain.append({
      experimentId: expId,
      configHash,
      resultHash,
      seed,
      softwareVersion: '1.0.0',
      protocolVersion: this.protocol.protocolVersion,
      detectorVersion: '2.1.0'
    });

    const stored: StoredExperiment = {
      experimentId: expId,
      timestamp: new Date().toISOString(),
      config: configPayload,
      results: decision,
      auditRecord,
      status: 'SIMULATED'
    };

    this.experiments.unshift(stored);
    return stored;
  }

  private seedInitialExperiments() {
    // Generate initial verified experiments for instant exploration
    this.runSimulation({
      message: 'QuantumShield Genesis Document',
      nQubits: 1000,
      noiseRate: 0.015,
      attackType: 'none',
      seed: 42,
      experimentId: 'exp_genesis_honest'
    });
    this.runSimulation({
      message: 'Intercept-Resend Red-Team Test',
      nQubits: 1000,
      noiseRate: 0.02,
      attackType: 'intercept_resend',
      attackStrength: 0.25,
      seed: 101,
      experimentId: 'exp_intercept_resend_25'
    });
  }
}

export const globalExperimentService = new ExperimentService();
