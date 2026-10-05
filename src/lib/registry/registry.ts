/**
 * Classical Registry System: Nonce, Timestamp, and Verifier Registry
 */

export interface RegistryCheckResult {
  passed: boolean;
  nonceCheck: {
    fresh: boolean;
    replayed: boolean;
    nonce: string;
  };
  timestampCheck: {
    valid: boolean;
    skewSeconds: number;
    maxSkewSeconds: number;
    timestamp: number;
  };
  verifierCheck: {
    authorized: boolean;
    verifierId: string;
  };
}

export class RegistryManager {
  private seenNonces: Map<string, { timestamp: number; experimentId: string }> = new Map();
  private authorizedVerifiers: Set<string> = new Set([
    'verifier_bob',
    'verifier_charlie',
    'verifier_eval_lab',
    'verifier_mobile_local'
  ]);
  readonly maxSkewSeconds: number;

  constructor(maxSkewSeconds: number = 300) {
    this.maxSkewSeconds = maxSkewSeconds;
  }

  checkAndRegister(
    nonce: string,
    timestamp: number,
    verifierId: string,
    experimentId: string,
    currentTime?: number
  ): RegistryCheckResult {
    const now = currentTime ?? 1775376000.0;
    const nonceFresh = !this.seenNonces.has(nonce);
    const skew = Math.abs(now - timestamp);
    const tsValid = skew <= this.maxSkewSeconds;
    const verifierAuthorized = this.authorizedVerifiers.has(verifierId);

    const passed = nonceFresh && tsValid && verifierAuthorized;

    if (nonceFresh) {
      this.seenNonces.set(nonce, { timestamp: now, experimentId });
    }

    return {
      passed,
      nonceCheck: {
        fresh: nonceFresh,
        replayed: !nonceFresh,
        nonce
      },
      timestampCheck: {
        valid: tsValid,
        skewSeconds: skew,
        maxSkewSeconds: this.maxSkewSeconds,
        timestamp
      },
      verifierCheck: {
        authorized: verifierAuthorized,
        verifierId
      }
    };
  }

  registerNonce(nonce: string, experimentId: string) {
    this.seenNonces.set(nonce, { timestamp: Date.now() / 1000, experimentId });
  }

  clear() {
    this.seenNonces.clear();
  }
}
