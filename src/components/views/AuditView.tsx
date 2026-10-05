import React, { useState } from 'react';
import { AuditChainManager, AuditRecordItem } from '../../lib/audit/auditChain';

interface AuditViewProps {
  auditChain: AuditChainManager;
}

export const AuditView: React.FC<AuditViewProps> = ({ auditChain }) => {
  const [verificationResult, setVerificationResult] = useState<{
    status: 'VALID' | 'INVALID';
    totalRecords: number;
    brokenIndex: number | null;
    reason?: string;
  } | null>(null);
  const [records, setRecords] = useState<AuditRecordItem[]>(auditChain.getRecords());

  const handleVerify = () => {
    const res = auditChain.verifyChain();
    setVerificationResult(res);
  };

  const handleSimulateTamper = (idx: number) => {
    auditChain.tamperBlock(idx, '00000000_TAMPERED_CONFIG_PAYLOAD_00000000');
    setRecords(auditChain.getRecords());
    // Auto re-verify to show detection
    const res = auditChain.verifyChain();
    setVerificationResult(res);
  };

  return (
    <div className="space-y-6">
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 text-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400">CRYPTOGRAPHIC AUDIT LEDGER</div>
            <h1 className="text-xl font-bold text-white mt-1">Immutable SHA-256 Hash Chain</h1>
            <p className="text-xs text-slate-400 mt-1">
              Every experiment configuration, raw measurement vector, and detector verdict is cryptographically bound into a sequential, tamper-evident hash chain.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              className="rounded bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-400 font-mono shrink-0"
            >
              Verify Audit Chain Integrity 🛡
            </button>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult && (
        <div
          className={`rounded border p-4 text-xs font-mono ${
            verificationResult.status === 'VALID'
              ? 'border-emerald-800/80 bg-emerald-950/20 text-emerald-300'
              : 'border-rose-800/80 bg-rose-950/20 text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">
                {verificationResult.status === 'VALID' ? '✔ AUDIT CHAIN VERIFIED: 100% VALID' : '✖ AUDIT CHAIN INTEGRITY BREACHED'}
              </span>
              <span className="text-slate-400">({verificationResult.totalRecords} blocks verified)</span>
            </div>
          </div>
          {verificationResult.reason && (
            <div className="mt-2 text-rose-400 font-bold">
              {verificationResult.reason}
            </div>
          )}
        </div>
      )}

      {/* Audit Blocks List */}
      <div className="space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 font-semibold uppercase text-[11px]">
          <span>Audit Records ({records.length} Blocks):</span>
          <span>Genesis → Head</span>
        </div>

        {records.length === 0 ? (
          <div className="rounded border border-slate-800 bg-[#0B0E17] p-8 text-center text-slate-500">
            No audit records created yet.
          </div>
        ) : (
          records.map((rec) => (
            <div
              key={rec.recordIndex}
              className="rounded border border-slate-800 bg-[#0B0E17] p-4 text-slate-300 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-cyan-400">BLOCK #{rec.recordIndex}</span>
                  <span className="text-slate-500">Exp: {rec.experimentId}</span>
                  <span className="text-slate-500">Seed: #{rec.seed}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">{new Date(rec.timestamp * 1000).toISOString()}</span>
                  <button
                    onClick={() => handleSimulateTamper(rec.recordIndex)}
                    className="rounded border border-rose-900/60 bg-rose-950/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-900/40"
                    title="Simulate data tampering in this block to test detector"
                  >
                    Test Tamper Block
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div>
                  <span className="text-slate-500">Previous Hash:</span>{' '}
                  <span className="text-slate-400 select-all font-mono break-all">{rec.previousHash}</span>
                </div>
                <div>
                  <span className="text-slate-500">Current Hash:</span>{' '}
                  <span className="text-cyan-300 font-bold select-all font-mono break-all">{rec.currentHash}</span>
                </div>
                <div>
                  <span className="text-slate-500">Config Hash:</span>{' '}
                  <span className="text-slate-400 select-all font-mono break-all">{rec.configHash}</span>
                </div>
                <div>
                  <span className="text-slate-500">Result Hash:</span>{' '}
                  <span className="text-slate-400 select-all font-mono break-all">{rec.resultHash}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
