import React from 'react';
import { StoredExperiment } from '../../lib/storage/experimentStore';
import { DistributionChart } from '../charts/DistributionChart';
import { SPRTChart } from '../charts/SPRTChart';

interface DetectionViewProps {
  experiment?: StoredExperiment;
  onReproduce: (id: string) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportHTML: () => void;
}

export const DetectionView: React.FC<DetectionViewProps> = ({
  experiment,
  onReproduce,
  onExportJSON,
  onExportCSV,
  onExportHTML
}) => {
  if (!experiment) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-slate-800 bg-[#0B0E17] text-xs font-mono text-slate-500">
        NO EVALUATION RUN SELECTED. PLEASE RUN A SIGNATURE OR ATTACK TEST FIRST.
      </div>
    );
  }

  const { results, config, experimentId, auditRecord } = experiment;
  const isAccept = results.verdict === 'ACCEPT';

  return (
    <div className="space-y-6">
      {/* Verdict & Primary Classification Header */}
      <div className={`rounded border p-6 ${
        isAccept
          ? 'border-emerald-800/80 bg-emerald-950/20'
          : 'border-rose-800/80 bg-rose-950/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
              DETERMINISTIC DECISION ENGINE VERDICT
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-extrabold font-mono tracking-tight ${
                isAccept ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {results.verdict}
              </span>
              <span className="text-sm font-mono text-slate-300">
                Threat Classification: <strong className="text-white">{results.threatType}</strong>
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">
              Experiment ID: {experimentId} · Seed: #{config.seed}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onReproduce(experimentId)}
              className="rounded border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200 transition-colors hover:bg-slate-700"
            >
              Reproduce Experiment ⟳
            </button>
            <button
              onClick={onExportHTML}
              className="rounded border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200 transition-colors hover:bg-slate-700"
            >
              Export HTML
            </button>
            <button
              onClick={onExportJSON}
              className="rounded border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200 transition-colors hover:bg-slate-700"
            >
              JSON
            </button>
            <button
              onClick={onExportCSV}
              className="rounded border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200 transition-colors hover:bg-slate-700"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Plain-Language Explanation Facts Box */}
        <div className="mt-5 rounded border border-slate-800 bg-[#07090E]/80 p-4 text-xs font-mono leading-relaxed text-slate-300">
          <div className="text-[11px] font-bold text-cyan-400 uppercase mb-1">
            DETERMINISTIC EVALUATION FINDING:
          </div>
          {results.explanation}
        </div>
      </div>

      {/* Primary Telemetry Grid (60-30-10, Tabular Figures) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded border border-slate-800 bg-[#0B0E17] p-4">
          <div className="text-xs font-mono text-slate-500 uppercase">MEASURED QBER</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
            {(results.qber * 100).toFixed(2)}%
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-400">
            {results.mismatches} / {results.nQubits} bits (95% CI: {(results.ci95.ciLower * 100).toFixed(2)}% - {(results.ci95.ciUpper * 100).toFixed(2)}%)
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-[#0B0E17] p-4">
          <div className="text-xs font-mono text-slate-500 uppercase">HONEST BASELINE (p0)</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-cyan-400">
            {(results.p0 * 100).toFixed(2)}%
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-400">
            Model: {config.noiseModel} ({(config.noiseRate * 100).toFixed(1)}%)
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-[#0B0E17] p-4">
          <div className="text-xs font-mono text-slate-500 uppercase">EXACT THRESHOLD (t)</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-400">
            {(results.thresholdRate * 100).toFixed(2)}%
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-400">
            Max allowed: {results.threshold} mismatches
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-[#0B0E17] p-4">
          <div className="text-xs font-mono text-slate-500 uppercase">EXACT P-VALUE</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
            {results.pValue < 1e-12 ? '< 1.00e-12' : results.pValue.toExponential(2)}
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-400">
            Standardized Z = {results.zscore.z.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Classical Registry Checks */}
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 text-slate-200">
        <div className="text-xs font-mono uppercase text-slate-400 font-semibold mb-3">
          Classical Registry Checks
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="rounded border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
            <div>
              <div className="text-slate-400">NONCE REGISTRY:</div>
              <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                {results.registryFindings.nonceCheck.nonce.slice(0, 16)}...
              </div>
            </div>
            <span className={`font-bold ${results.registryFindings.nonceCheck.fresh ? 'text-emerald-400' : 'text-rose-400'}`}>
              {results.registryFindings.nonceCheck.fresh ? 'FRESH (OK)' : 'REPLAY BLOCKED'}
            </span>
          </div>

          <div className="rounded border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
            <div>
              <div className="text-slate-400">TIMESTAMP WINDOW:</div>
              <div className="text-[11px] text-slate-500">
                Skew: {results.registryFindings.timestampCheck.skewSeconds.toFixed(2)}s (max {results.registryFindings.timestampCheck.maxSkewSeconds}s)
              </div>
            </div>
            <span className={`font-bold ${results.registryFindings.timestampCheck.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
              {results.registryFindings.timestampCheck.valid ? 'VALID (OK)' : 'EXPIRED'}
            </span>
          </div>

          <div className="rounded border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
            <div>
              <div className="text-slate-400">VERIFIER AUTH:</div>
              <div className="text-[11px] text-slate-500">
                ID: {results.registryFindings.verifierCheck.verifierId}
              </div>
            </div>
            <span className={`font-bold ${results.registryFindings.verifierCheck.authorized ? 'text-emerald-400' : 'text-rose-400'}`}>
              {results.registryFindings.verifierCheck.authorized ? 'AUTHORIZED (OK)' : 'UNAUTHORIZED'}
            </span>
          </div>
        </div>
      </div>

      {/* Visualizations: Exact Binomial Hypothesis Distribution & SPRT Trajectory */}
      <div className="grid grid-cols-1 gap-6">
        <DistributionChart
          nQubits={results.nQubits}
          p0={results.p0}
          mismatches={results.mismatches}
          threshold={results.threshold}
          thresholdRate={results.thresholdRate}
          qber={results.qber}
        />

        {results.sprtResult && (
          <SPRTChart sprt={results.sprtResult} />
        )}
      </div>

      {/* Cryptographic Audit Verification Link */}
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-4 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-slate-500">AUDIT RECORD HASH:</span>
          <span className="text-slate-200 ml-2 font-bold select-all">
            {auditRecord?.currentHash ?? 'Computed'}
          </span>
        </div>
        <div className="text-slate-500">
          Previous Hash: {auditRecord?.previousHash.slice(0, 16)}...
        </div>
      </div>
    </div>
  );
};
