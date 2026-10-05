/**
 * Detection Engine: Wald's Sequential Probability Ratio Test (SPRT)
 */

export interface SPRTResult {
  verdict: 'ACCEPT' | 'REJECT' | 'INCONCLUSIVE';
  samplesConsumed: number;
  maxSamples: number;
  finalLLR: number;
  llrTrajectory: number[];
  upperBoundaryA: number;
  lowerBoundaryB: number;
  p0: number;
  p1: number;
  alpha: number;
  beta: number;
  sampleEfficiency: number;
}

export function runSPRT(
  mismatchStream: number[],
  p0: number,
  p1: number,
  alpha: number = 1e-4,
  beta: number = 1e-4
): SPRTResult {
  const p0Clamped = Math.max(1e-6, Math.min(1 - 1e-6, p0));
  const p1Clamped = Math.max(p0Clamped + 1e-6, Math.min(1 - 1e-6, p1));
  const alphaClamped = Math.max(1e-12, Math.min(0.5, alpha));
  const betaClamped = Math.max(1e-12, Math.min(0.5, beta));

  const upperA = Math.log((1 - betaClamped) / alphaClamped);
  const lowerB = Math.log(betaClamped / (1 - alphaClamped));

  const llrMismatch = Math.log(p1Clamped / p0Clamped);
  const llrMatch = Math.log((1 - p1Clamped) / (1 - p0Clamped));

  let llr = 0;
  const trajectory: number[] = [0];
  let verdict: 'ACCEPT' | 'REJECT' | 'INCONCLUSIVE' = 'INCONCLUSIVE';
  let samplesConsumed = 0;

  for (let i = 0; i < mismatchStream.length; i++) {
    samplesConsumed = i + 1;
    const bit = mismatchStream[i];
    llr += bit === 1 ? llrMismatch : llrMatch;
    trajectory.push(llr);

    if (llr >= upperA) {
      verdict = 'REJECT';
      break;
    } else if (llr <= lowerB) {
      verdict = 'ACCEPT';
      break;
    }
  }

  if (verdict === 'INCONCLUSIVE') {
    verdict = llr > 0 ? 'REJECT' : 'ACCEPT';
  }

  return {
    verdict,
    samplesConsumed,
    maxSamples: mismatchStream.length,
    finalLLR: llr,
    llrTrajectory: trajectory,
    upperBoundaryA: upperA,
    lowerBoundaryB: lowerB,
    p0: p0Clamped,
    p1: p1Clamped,
    alpha: alphaClamped,
    beta: betaClamped,
    sampleEfficiency: 1.0 - (samplesConsumed / Math.max(1, mismatchStream.length))
  };
}
