/**
 * QDS-Bench: Standardized Evaluation Scenarios (TypeScript)
 */

import { TeleportationQDSProtocol } from '../protocol/qds';
import { NoiseModel, calibrateChannel } from '../channel/noise';
import { AttackEngine, AttackType } from '../attacks/attacks';
import { RegistryManager } from '../registry/registry';
import { DecisionEngine, DecisionEvaluationResult } from '../detection/decision';
import { DeterministicPRNG } from '../prng';

export interface BenchmarkScenarioDef {
  id: string;
  name: string;
  protocol: string;
  version: string;
  noiseModel: 'depolarizing' | 'bit_flip' | 'phase_flip' | 'none';
  noiseRate: number;
  attackType: AttackType;
  attackStrength: number;
  nQubits: number;
  expectedVerdict: 'ACCEPT' | 'REJECT';
  expectedThreat: string;
  description: string;
}

export const BENCHMARK_SCENARIOS: BenchmarkScenarioDef[] = [
  {
    id: 'QDS-BENCH-01',
    name: 'Honest Channel Stability',
    protocol: 'Teleportation-QDS',
    version: 'QDS-v1.0',
    noiseModel: 'depolarizing',
    noiseRate: 0.02,
    attackType: 'none',
    attackStrength: 0.0,
    nQubits: 1000,
    expectedVerdict: 'ACCEPT',
    expectedThreat: 'NONE',
    description: 'Verifies that unattacked honest transmission produces QBER within calibrated error bounds.'
  },
  {
    id: 'QDS-BENCH-02',
    name: 'Blind Forgery Resistance',
    protocol: 'Teleportation-QDS',
    version: 'QDS-v1.0',
    noiseModel: 'depolarizing',
    noiseRate: 0.02,
    attackType: 'forgery',
    attackStrength: 1.0,
    nQubits: 1000,
    expectedVerdict: 'REJECT',
    expectedThreat: 'FORGERY',
    description: 'Evaluates detection when an attacker attempts to sign without legitimate private keys.'
  },
  {
    id: 'QDS-BENCH-03',
    name: 'Signer Impersonation Detection',
    protocol: 'Teleportation-QDS',
    version: 'QDS-v1.0',
    noiseModel: 'depolarizing',
    noiseRate: 0.02,
    attackType: 'impersonation',
    attackStrength: 1.0,
    nQubits: 1000,
    expectedVerdict: 'REJECT',
    expectedThreat: 'IMPERSONATION',
    description: 'Simulates attacker replacing legitimate signer states with arbitrary substituted states.'
  },
  {
    id: 'QDS-BENCH-04',
    name: 'Nonce-Replay Registry Enforcement',
    protocol: 'Teleportation-QDS',
    version: 'QDS-v1.0',
    noiseModel: 'depolarizing',
    noiseRate: 0.02,
    attackType: 'replay',
    attackStrength: 0.0,
    nQubits: 1000,
    expectedVerdict: 'REJECT',
    expectedThreat: 'REPLAY',
    description: 'Tests classical registry replay detection when a previously valid signature is re-submitted.'
  },
  {
    id: 'QDS-BENCH-05',
    name: 'Unauthorized Verifier Access Control',
    protocol: 'Teleportation-QDS',
    version: 'QDS-v1.0',
    noiseModel: 'depolarizing',
    noiseRate: 0.02,
    attackType: 'unauthorized_verification',
    attackStrength: 0.0,
    nQubits: 1000,
    expectedVerdict: 'REJECT',
    expectedThreat: 'UNAUTHORIZED_VERIFICATION',
    description: 'Ensures that unlisted or revoked verifier entities are strictly rejected.'
  },
  {
    id: 'QDS-BENCH-06',
    name: 'Intercept-Resend Attack Detection Sensitivity',
    protocol: 'Teleportation-QDS',
    version: 'QDS-v1.0',
    noiseModel: 'depolarizing',
    noiseRate: 0.02,
    attackType: 'intercept_resend',
    attackStrength: 0.20,
    nQubits: 1000,
    expectedVerdict: 'REJECT',
    expectedThreat: 'CHANNEL_MANIPULATION',
    description: 'Tests statistical sensitivity to 20% quantum eavesdropping (intercept-resend).'
  },
  {
    id: 'QDS-BENCH-07',
    name: 'Adaptive Stealth Attacker Boundary Test',
    protocol: 'Teleportation-QDS',
    version: 'QDS-v1.0',
    noiseModel: 'depolarizing',
    noiseRate: 0.02,
    attackType: 'stealth',
    attackStrength: 0.10,
    nQubits: 1000,
    expectedVerdict: 'REJECT',
    expectedThreat: 'STEALTH_THRESHOLD_EVENT',
    description: 'Evaluates red-team adversarial boundary hugging attempt.'
  },
  {
    id: 'QDS-BENCH-08',
    name: 'Sequential Detection (SPRT) Sample Efficiency',
    protocol: 'Teleportation-QDS',
    version: 'QDS-v1.0',
    noiseModel: 'depolarizing',
    noiseRate: 0.02,
    attackType: 'intercept_resend',
    attackStrength: 0.30,
    nQubits: 1000,
    expectedVerdict: 'REJECT',
    expectedThreat: 'CHANNEL_MANIPULATION',
    description: 'Measures sample reduction efficiency achieved by Wald SPRT over fixed-size testing.'
  }
];

export interface BenchmarkRunResult {
  scenarioId: string;
  name: string;
  expectedVerdict: string;
  actualVerdict: string;
  threatClassification: string;
  qber: number;
  p0: number;
  thresholdRate: number;
  pValue: number;
  sprtEfficiency: number;
  passed: boolean;
  experimentId: string;
}

export class QDSBenchSuite {
  static runScenario(sc: BenchmarkScenarioDef, seedBase: number = 777): BenchmarkRunResult {
    const protocol = new TeleportationQDSProtocol();
    const registry = new RegistryManager();
    const noise = new NoiseModel(sc.noiseModel, sc.noiseRate);

    const calib = calibrateChannel(noise, Math.min(500, sc.nQubits), seedBase + 1);
    const p0 = calib.p0Empirical > 0 ? calib.p0Empirical : noise.theoreticalP0();

    const keyData = protocol.generateKeys(sc.nQubits, seedBase);
    const dist = protocol.distributeKeys(keyData, noise, seedBase + 2);

    let modifiedStates = [...dist.teleportedStates];
    const prng = new DeterministicPRNG(seedBase + 3);
    let verifierId = 'verifier_bob';
    let customNonce: string | undefined;

    if (sc.attackType === 'forgery') {
      modifiedStates = AttackEngine.applyForgery(modifiedStates, prng);
    } else if (sc.attackType === 'impersonation') {
      modifiedStates = AttackEngine.applyImpersonation(modifiedStates, prng);
    } else if (sc.attackType === 'intercept_resend') {
      modifiedStates = AttackEngine.applyInterceptResend(modifiedStates, sc.attackStrength, prng);
    } else if (sc.attackType === 'stealth') {
      const { modifiedStates: sMod } = AttackEngine.applyStealthAttack(modifiedStates, p0 + 0.05, p0, prng);
      modifiedStates = sMod;
    } else if (sc.attackType === 'replay') {
      customNonce = `replayed_bench_nonce_${seedBase}`;
      registry.registerNonce(customNonce, 'prior_exp');
    } else if (sc.attackType === 'unauthorized_verification') {
      verifierId = 'unregistered_adversary_node';
    }

    const expId = `bench_${sc.id.toLowerCase()}`;
    const sig = protocol.sign('QDS Benchmark Message', keyData, verifierId, seedBase + 4, customNonce);
    const verify = protocol.verify(sig, modifiedStates, seedBase + 5);

    const reg = registry.checkAndRegister(sig.nonce, sig.timestamp, sig.verifierId, expId, sig.timestamp);
    const decision = DecisionEngine.evaluate({
      mismatches: verify.mismatches,
      nQubits: verify.nVerified,
      p0,
      registryRes: reg,
      mismatchStream: verify.mismatchStream,
      attackHint: sc.attackType,
      experimentId: expId
    });

    const passed = decision.verdict === sc.expectedVerdict;
    const sprtEff = decision.sprtResult ? decision.sprtResult.sampleEfficiency : 0;

    return {
      scenarioId: sc.id,
      name: sc.name,
      expectedVerdict: sc.expectedVerdict,
      actualVerdict: decision.verdict,
      threatClassification: decision.threatType,
      qber: decision.qber,
      p0: decision.p0,
      thresholdRate: decision.thresholdRate,
      pValue: decision.pValue,
      sprtEfficiency: sprtEff,
      passed,
      experimentId: expId
    };
  }

  static runAll(seedBase: number = 777): {
    suiteName: string;
    totalScenarios: number;
    passedScenarios: number;
    passRate: number;
    allPassed: boolean;
    scenarios: BenchmarkRunResult[];
  } {
    const scenarios: BenchmarkRunResult[] = [];
    let passed = 0;

    for (let i = 0; i < BENCHMARK_SCENARIOS.length; i++) {
      const res = QDSBenchSuite.runScenario(BENCHMARK_SCENARIOS[i], seedBase + i * 53);
      if (res.passed) passed++;
      scenarios.push(res);
    }

    return {
      suiteName: 'QDS-Bench Standard Evaluation Suite',
      totalScenarios: BENCHMARK_SCENARIOS.length,
      passedScenarios: passed,
      passRate: passed / BENCHMARK_SCENARIOS.length,
      allPassed: passed === BENCHMARK_SCENARIOS.length,
      scenarios
    };
  }
}
