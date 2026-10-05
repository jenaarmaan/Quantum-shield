/**
 * Advisor Engine & Security Boundary Mapper (TypeScript)
 */

import { normalQuantile } from '../detection/math';

export interface AdvisorRecommendation {
  status: 'THEORETICAL' | 'EMPIRICALLY_VALIDATED';
  operatingRegion: 'SAFE' | 'DETECTABLE' | 'AMBIGUOUS' | 'UNRELIABLE';
  feasible: boolean;
  noiseRate: number;
  p0Honest: number;
  p1Attack: number;
  deltaQBER: number;
  targetFAR: number;
  targetFRR: number;
  recommendedNQubits: number;
  thresholdCount: number;
  thresholdRate: number;
  expectedFAR: number;
  expectedFRR: number;
  tradeOffs: {
    qubitOverhead: string;
    detectionPower: string;
    notes: string;
  };
}

export class ParameterAdvisor {
  static advise(params: {
    noiseRate: number;
    targetFAR: number;
    targetFRR: number;
    attackStrength?: number;
    noiseModel?: string;
  }): AdvisorRecommendation {
    const noiseRate = Math.max(0.0001, Math.min(0.40, params.noiseRate));
    const targetFAR = Math.max(1e-9, Math.min(0.20, params.targetFAR));
    const targetFRR = Math.max(1e-9, Math.min(0.20, params.targetFRR));
    const attackStrength = Math.max(0.01, Math.min(1.0, params.attackStrength ?? 0.20));

    const p0 = Math.max(0.0005, Math.min(0.40, (2 / 3) * noiseRate));
    const delta = (1 / 3) * attackStrength;
    const p1 = Math.min(0.50, p0 + delta);

    const zAlpha = normalQuantile(1.0 - targetFAR);
    const zBeta = normalQuantile(1.0 - targetFRR);

    const num = zAlpha * Math.sqrt(p0 * (1 - p0)) + zBeta * Math.sqrt(p1 * (1 - p1));
    const denom = p1 - p0;
    const nCalc = denom > 0 ? Math.ceil((num / denom) ** 2) : 10000;
    const recommendedNQubits = Math.max(64, Math.min(200000, nCalc));

    const thresholdCount = Math.ceil(
      recommendedNQubits * p0 + zAlpha * Math.sqrt(recommendedNQubits * p0 * (1 - p0))
    );
    const thresholdRate = thresholdCount / recommendedNQubits;

    const feasible = recommendedNQubits <= 50000 && p1 > p0 * 1.25;
    const operatingRegion = feasible
      ? 'DETECTABLE'
      : recommendedNQubits <= 100000
      ? 'AMBIGUOUS'
      : 'UNRELIABLE';

    return {
      status: 'THEORETICAL',
      operatingRegion,
      feasible,
      noiseRate,
      p0Honest: p0,
      p1Attack: p1,
      deltaQBER: delta,
      targetFAR,
      targetFRR,
      recommendedNQubits,
      thresholdCount,
      thresholdRate,
      expectedFAR: targetFAR,
      expectedFRR: targetFRR,
      tradeOffs: {
        qubitOverhead: recommendedNQubits > 5000 ? 'High' : recommendedNQubits > 1000 ? 'Moderate' : 'Low',
        detectionPower: `${((1.0 - targetFRR) * 100).toFixed(2)}%`,
        notes: 'Analytic sample size based on normal expansion. Use Experiment Runner for empirical verification.'
      }
    };
  }
}

export interface SecurityBoundaryPoint {
  noiseRate: number;
  attackStrength: number;
  nQubits: number;
  p0: number;
  p1: number;
  detectionPower: number;
  region: 'SAFE' | 'DETECTABLE' | 'AMBIGUOUS' | 'UNRELIABLE';
  description: string;
}

export class SecurityBoundaryEngine {
  static evaluatePoint(noiseRate: number, attackStrength: number, nQubits: number): SecurityBoundaryPoint {
    const p0 = (2 / 3) * noiseRate;
    const delta = (1 / 3) * attackStrength;
    const p1 = p0 + delta;

    const sigma0 = Math.sqrt(nQubits * p0 * (1 - p0));
    const zCrit = 3.719; // alpha ~ 1e-4
    const threshold = nQubits * p0 + zCrit * sigma0;

    const meanAttack = nQubits * p1;
    const sigma1 = Math.sqrt(nQubits * p1 * (1 - p1));

    const zAttack = sigma1 > 0 ? (threshold - meanAttack) / sigma1 : 0;
    // P(X >= t | H1)
    const x = zAttack / Math.SQRT2;
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1.0 / (1.0 + 0.3275911 * ax);
    const y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
    const erf = sign * y;
    const detectionPower = Math.max(0, Math.min(1, 0.5 * (1.0 - erf)));

    let region: 'SAFE' | 'DETECTABLE' | 'AMBIGUOUS' | 'UNRELIABLE';
    let description: string;

    if (noiseRate >= 0.22) {
      region = 'UNRELIABLE';
      description = 'Channel noise exceeds validated threshold capacity.';
    } else if (attackStrength <= 0.02) {
      region = 'SAFE';
      description = 'Disturbance within honest baseline variation.';
    } else if (detectionPower >= 0.95) {
      region = 'DETECTABLE';
      description = 'Detected within configured error bounds.';
    } else if (detectionPower >= 0.50) {
      region = 'AMBIGUOUS';
      description = 'Statistical overlap between H0 and H1 under finite sample size.';
    } else {
      region = 'UNRELIABLE';
      description = 'Outside validated operating boundary.';
    }

    return {
      noiseRate,
      attackStrength,
      nQubits,
      p0,
      p1,
      detectionPower,
      region,
      description
    };
  }

  static generateGrid(nQubits: number = 1000): SecurityBoundaryPoint[] {
    const noiseLevels = [0.005, 0.01, 0.02, 0.04, 0.06, 0.08, 0.10, 0.15, 0.20];
    const attackLevels = [0.02, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.60, 0.80, 1.00];
    const grid: SecurityBoundaryPoint[] = [];

    for (const n of noiseLevels) {
      for (const a of attackLevels) {
        grid.push(SecurityBoundaryEngine.evaluatePoint(n, a, nQubits));
      }
    }
    return grid;
  }
}
