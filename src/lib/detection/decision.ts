/**
 * Central Deterministic Decision Engine (TypeScript)
 * Enforces strict scientific principles:
 * - AI/ML NEVER decides whether a signature is accepted or rejected.
 * - Verdict is strictly computed from measured quantum data and classical registry rules.
 */

import {
  exactBinomialTail,
  computeBinomialThreshold,
  computeZScore
} from './math';
import { runSPRT, SPRTResult } from './sprt';
import { wilsonScoreInterval } from '../channel/noise';
import { RegistryCheckResult } from '../registry/registry';

export type Verdict = 'ACCEPT' | 'REJECT';

export type ThreatType =
  | 'NONE'
  | 'FORGERY'
  | 'IMPERSONATION'
  | 'REPLAY'
  | 'UNAUTHORIZED_VERIFICATION'
  | 'CHANNEL_MANIPULATION'
  | 'STEALTH_THRESHOLD_EVENT'
  | 'STATISTICAL ANOMALY — ATTACK TYPE NOT UNIQUELY IDENTIFIED';

export interface DecisionEvaluationResult {
  verdict: Verdict;
  threatType: ThreatType;
  qber: number;
  mismatches: number;
  nQubits: number;
  p0: number;
  threshold: number;
  thresholdRate: number;
  pValue: number;
  zscore: {
    z: number;
    pValueApprox: number;
    expectedMean: number;
    stdDev: number;
  };
  registryFindings: RegistryCheckResult;
  ci95: {
    pHat: number;
    ciLower: number;
    ciUpper: number;
  };
  explanation: string;
  sprtResult?: SPRTResult;
  experimentId: string;
}

export class DecisionEngine {
  static evaluate(context: {
    mismatches: number;
    nQubits: number;
    p0: number;
    alpha?: number;
    beta?: number;
    registryRes: RegistryCheckResult;
    mismatchStream?: number[];
    attackHint?: string;
    experimentId?: string;
  }): DecisionEvaluationResult {
    const n = Math.max(1, context.nQubits);
    const k = context.mismatches;
    const p0 = Math.max(0.0001, context.p0);
    const alpha = context.alpha ?? 1e-4;
    const beta = context.beta ?? 1e-4;
    const expId = context.experimentId ?? 'exp_local';
    const qber = k / n;

    // 1. Exact Binomial Threshold & Tail Probability
    const threshold = computeBinomialThreshold(n, p0, alpha);
    const thresholdRate = threshold / n;
    const pValue = exactBinomialTail(k, n, p0);

    // 2. Z-Score
    const zscore = computeZScore(k, n, p0);

    // 3. 95% Wilson Score Interval
    const ci95 = wilsonScoreInterval(k, n, 0.95);

    // 4. SPRT (if mismatch stream provided)
    let sprtResult: SPRTResult | undefined;
    let sprtReject = false;
    if (context.mismatchStream && context.mismatchStream.length > 0) {
      const p1 = Math.max(p0 + 0.05, thresholdRate);
      sprtResult = runSPRT(context.mismatchStream, p0, p1, alpha, beta);
      if (sprtResult.verdict === 'REJECT') {
        sprtReject = true;
      }
    }

    // 5. Deterministic Acceptance Condition
    const registryPassed = context.registryRes.passed;
    const isQuantumRejected = k >= threshold || pValue <= alpha || sprtReject;
    const verdict: Verdict = (!registryPassed || isQuantumRejected) ? 'REJECT' : 'ACCEPT';

    // 6. Threat Classification
    let threatType: ThreatType = 'NONE';
    if (verdict === 'REJECT') {
      if (context.registryRes.nonceCheck.replayed) {
        threatType = 'REPLAY';
      } else if (!context.registryRes.verifierCheck.authorized) {
        threatType = 'UNAUTHORIZED_VERIFICATION';
      } else if (!context.registryRes.timestampCheck.valid) {
        threatType = 'REPLAY';
      } else if (context.attackHint === 'forgery' && Math.abs(qber - 0.5) < 0.15) {
        threatType = 'FORGERY';
      } else if (context.attackHint === 'impersonation') {
        threatType = 'IMPERSONATION';
      } else if (context.attackHint === 'intercept_resend') {
        threatType = 'CHANNEL_MANIPULATION';
      } else if (context.attackHint === 'stealth') {
        threatType = 'STEALTH_THRESHOLD_EVENT';
      } else if (Math.abs(qber - 0.5) < 0.08) {
        threatType = 'FORGERY';
      } else if (qber > thresholdRate && qber < 0.35) {
        threatType = 'CHANNEL_MANIPULATION';
      } else {
        threatType = 'STATISTICAL ANOMALY — ATTACK TYPE NOT UNIQUELY IDENTIFIED';
      }
    }

    // 7. Structured Plain-Language Explanation
    const explanation = DecisionEngine.buildExplanation({
      verdict,
      threatType,
      qber,
      p0,
      thresholdRate,
      mismatches: k,
      threshold,
      pValue,
      reg: context.registryRes
    });

    return {
      verdict,
      threatType,
      qber,
      mismatches: k,
      nQubits: n,
      p0,
      threshold,
      thresholdRate,
      pValue,
      zscore,
      registryFindings: context.registryRes,
      ci95,
      explanation,
      sprtResult,
      experimentId: expId
    };
  }

  private static buildExplanation(params: {
    verdict: Verdict;
    threatType: ThreatType;
    qber: number;
    p0: number;
    thresholdRate: number;
    mismatches: number;
    threshold: number;
    pValue: number;
    reg: RegistryCheckResult;
  }): string {
    const { verdict, threatType, qber, p0, thresholdRate, mismatches, threshold, pValue, reg } = params;

    if (reg.nonceCheck.replayed) {
      return 'Signature rejected: Nonce has already been observed in the cryptographic audit registry. Potential replay attack blocked.';
    }
    if (!reg.verifierCheck.authorized) {
      return 'Signature rejected: Verifier identity is not authorized in the verifier access control registry.';
    }
    if (!reg.timestampCheck.valid) {
      return 'Signature rejected: Signature timestamp falls outside the acceptable clock skew window.';
    }

    if (verdict === 'REJECT') {
      return (
        `Signature rejected because the observed quantum bit error rate (${(qber * 100).toFixed(2)}%, ${mismatches} mismatches) ` +
        `exceeded the calibrated honest threshold (${(thresholdRate * 100).toFixed(2)}%, ${threshold} max allowed) ` +
        `with exact binomial upper-tail significance p = ${pValue < 1e-12 ? '< 1e-12' : pValue.toExponential(2)}. ` +
        `Threat classified as ${threatType}.`
      );
    }

    return (
      `Signature accepted: Measured QBER (${(qber * 100).toFixed(2)}%) remained consistent with the calibrated honest channel baseline ` +
      `(${(p0 * 100).toFixed(2)}%) and stayed strictly below the critical rejection threshold (${(thresholdRate * 100).toFixed(2)}%). ` +
      `Classical nonce, timestamp window, and verifier permissions verified.`
    );
  }
}
