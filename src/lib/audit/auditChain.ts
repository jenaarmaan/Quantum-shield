/**
 * Audit System: Hash-Linked Audit Chain & Experiment Manifests (TypeScript)
 */

import { sha256Sync } from '../protocol/sha256';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditRecordItem {
  recordIndex: number;
  experimentId: string;
  configHash: string;
  resultHash: string;
  previousHash: string;
  currentHash: string;
  seed: number;
  softwareVersion: string;
  protocolVersion: string;
  detectorVersion: string;
  timestamp: number;
}

export function computeAuditRecordHash(rec: {
  recordIndex: number;
  experimentId: string;
  configHash: string;
  resultHash: string;
  previousHash: string;
  seed: number;
  softwareVersion: string;
  protocolVersion: string;
  detectorVersion: string;
  timestamp: number;
}): string {
  const payload = `${rec.recordIndex}:${rec.previousHash}:${rec.experimentId}:${rec.configHash}:${rec.resultHash}:${rec.seed}:${rec.softwareVersion}:${rec.protocolVersion}:${rec.detectorVersion}:${rec.timestamp.toFixed(6)}`;
  return sha256Sync(payload);
}

export class AuditChainManager {
  private records: AuditRecordItem[] = [];

  constructor(initialRecords: AuditRecordItem[] = []) {
    this.records = [...initialRecords];
  }

  getRecords(): AuditRecordItem[] {
    return [...this.records];
  }

  append(params: {
    experimentId: string;
    configHash: string;
    resultHash: string;
    seed: number;
    softwareVersion?: string;
    protocolVersion?: string;
    detectorVersion?: string;
    timestamp?: number;
  }): AuditRecordItem {
    const idx = this.records.length;
    const prevHash = idx === 0 ? GENESIS_HASH : this.records[idx - 1].currentHash;
    const ts = params.timestamp ?? 1775376000.0;
    const softwareVer = params.softwareVersion ?? '1.0.0';
    const protocolVer = params.protocolVersion ?? 'QDS-v1.0';
    const detectorVer = params.detectorVersion ?? '2.1.0';

    const base = {
      recordIndex: idx,
      experimentId: params.experimentId,
      configHash: params.configHash,
      resultHash: params.resultHash,
      previousHash: prevHash,
      seed: params.seed,
      softwareVersion: softwareVer,
      protocolVersion: protocolVer,
      detectorVersion: detectorVer,
      timestamp: ts
    };

    const currentHash = computeAuditRecordHash(base);
    const fullRecord: AuditRecordItem = { ...base, currentHash };
    this.records.push(fullRecord);
    return fullRecord;
  }

  verifyChain(): {
    status: 'VALID' | 'INVALID';
    totalRecords: number;
    brokenIndex: number | null;
    reason?: string;
  } {
    if (this.records.length === 0) {
      return { status: 'VALID', totalRecords: 0, brokenIndex: null };
    }

    for (let i = 0; i < this.records.length; i++) {
      const rec = this.records[i];
      const expectedPrev = i === 0 ? GENESIS_HASH : this.records[i - 1].currentHash;

      if (rec.previousHash !== expectedPrev) {
        return {
          status: 'INVALID',
          totalRecords: this.records.length,
          brokenIndex: i,
          reason: `Previous hash link broken at block ${i}: expected ${expectedPrev.slice(0, 12)}..., found ${rec.previousHash.slice(0, 12)}...`
        };
      }

      const recomputed = computeAuditRecordHash(rec);
      if (rec.currentHash !== recomputed) {
        return {
          status: 'INVALID',
          totalRecords: this.records.length,
          brokenIndex: i,
          reason: `Block content signature tampered at block ${i}: stored ${rec.currentHash.slice(0, 12)}..., computed ${recomputed.slice(0, 12)}...`
        };
      }
    }

    return {
      status: 'VALID',
      totalRecords: this.records.length,
      brokenIndex: null
    };
  }

  tamperBlock(index: number, fakeHash: string) {
    if (index >= 0 && index < this.records.length) {
      this.records[index].configHash = fakeHash;
    }
  }
}
