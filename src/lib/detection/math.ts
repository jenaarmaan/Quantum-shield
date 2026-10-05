/**
 * Detection Engine: High Precision Mathematical Primitives
 * - Lanczos log-gamma
 * - Continued fraction regularized incomplete beta function (Lentz method)
 * - Exact binomial upper-tail probability
 * - Exact threshold calculation via binary search
 * - Z-score & normal approximations
 * - Beasley-Springer-Moro normal quantile
 */

export function logGamma(x: number): number {
  // Lanczos approximation (g=7, n=9)
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.138571095836526,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];

  if (x < 0.5) {
    // Reflection formula: Gamma(1-z)*Gamma(z) = pi / sin(pi*z)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }

  const z = x - 1;
  let a = p[0];
  const t = z + 7.5;
  for (let i = 1; i < p.length; i++) {
    a += p[i] / (z + i);
  }

  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

export function betainc(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Symmetry transformation
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - betainc(b, a, 1 - x);
  }

  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a;

  const tiny = 1e-30;
  let c = 1.0;
  let d = 1.0 - (a + b) * x / (a + 1.0);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1.0 / d;
  let f = d;

  const maxIter = 300;
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    // Even step
    const numEven = (m * (b - m) * x) / ((a + m2 - 1.0) * (a + m2));
    d = 1.0 + numEven * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1.0 + numEven / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1.0 / d;
    f *= (c * d);

    // Odd step
    const numOdd = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1.0));
    d = 1.0 + numOdd * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1.0 + numOdd / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1.0 / d;
    f *= (c * d);

    if (Math.abs(c * d - 1.0) < 1e-15) {
      break;
    }
  }

  return front * f;
}

export function exactBinomialTail(k: number, n: number, p0: number): number {
  if (k <= 0) return 1.0;
  if (k > n) return 0.0;
  if (p0 <= 0) return 0.0;
  if (p0 >= 1) return 1.0;

  // Identity: P(X >= k | n, p0) = I_{p0}(k, n - k + 1)
  const a = k;
  const b = n - k + 1;
  const tail = betainc(a, b, p0);
  return Math.max(0, Math.min(1, tail));
}

export function computeBinomialThreshold(n: number, p0: number, alpha: number): number {
  if (p0 <= 0) return 1;
  if (alpha >= 1) return 0;

  let low = 0;
  let high = n + 1;
  let threshold = n + 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const pVal = exactBinomialTail(mid, n, p0);
    if (pVal <= alpha) {
      threshold = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return threshold;
}

export function normalQuantile(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  if (p < 0.5) return -normalQuantile(1 - p);

  const t = Math.sqrt(-2.0 * Math.log(1.0 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  const num = c0 + t * (c1 + t * c2);
  const den = 1.0 + t * (d1 + t * (d2 + t * d3));
  return t - (num / den);
}

export function computeZScore(k: number, n: number, p0: number): {
  z: number;
  pValueApprox: number;
  expectedMean: number;
  stdDev: number;
} {
  if (n <= 0 || p0 <= 0 || p0 >= 1) {
    return { z: 0, pValueApprox: 1, expectedMean: 0, stdDev: 0 };
  }

  const mean = n * p0;
  const variance = n * p0 * (1.0 - p0);
  const stdDev = Math.sqrt(variance);
  const z = stdDev > 0 ? (k - mean) / stdDev : 0;

  // Approximate upper-tail using erfc
  // erfc approximation
  const x = z / Math.SQRT2;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  const erf = sign * y;
  const pApprox = 0.5 * (1.0 - erf);

  return {
    z,
    pValueApprox: Math.max(0, Math.min(1, pApprox)),
    expectedMean: mean,
    stdDev
  };
}
