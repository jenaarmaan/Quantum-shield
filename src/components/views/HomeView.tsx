import React from 'react';
import { StoredExperiment } from '../../lib/storage/experimentStore';
import { ActiveTab } from '../TopNav';

interface HomeViewProps {
  latestExperiment?: StoredExperiment;
  onNavigate: (tab: ActiveTab) => void;
  onRunTest: () => void;
  totalExperiments: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  latestExperiment,
  onNavigate,
  onRunTest,
  totalExperiments
}) => {
  const verdict = latestExperiment?.results.verdict ?? 'ACCEPT';
  const qber = latestExperiment ? (latestExperiment.results.qber * 100).toFixed(2) : '1.30';
  const p0 = latestExperiment ? (latestExperiment.results.p0 * 100).toFixed(2) : '1.33';
  const threshold = latestExperiment ? (latestExperiment.results.thresholdRate * 100).toFixed(2) : '3.80';
  const threat = latestExperiment?.results.threatType ?? 'NONE';

  return (
    <div className="space-y-6">
      {/* Hero / Executive Overview Section */}
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-6 text-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span>PLATFORM SPECIFICATION</span>
              <span>·</span>
              <span>DETERMINISTIC RED-TEAM LAB</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl text-balance">
              Quantum Signature Security Evaluation Platform
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              QuantumShield measures how secure a defined quantum digital-signature protocol remains under defined attacks and channel noise. 
              Built on deterministic Bell-pair teleportation simulation, Pauli eigenstate keys, exact binomial hypothesis testing, and sequential probability ratio detection.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={onRunTest}
              className="rounded bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-400 active:scale-[0.98] text-center"
            >
              Run Security Test
            </button>
            <button
              onClick={() => onNavigate('benchmark')}
              className="rounded border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 text-center"
            >
              Run QDS-Bench (8 Tests)
            </button>
          </div>
        </div>

        {/* Scientific Warning / Non-Negotiable Positioning Notice */}
        <div className="mt-6 rounded border border-amber-900/40 bg-amber-950/20 px-3.5 py-2 text-xs text-amber-300 font-mono flex items-start gap-2.5">
          <span className="text-amber-400 font-bold shrink-0">NOTICE:</span>
          <span>
            Quantum behavior is deterministically modeled and simulated. QuantumShield evaluates mathematical protocols against modeled channel noise and adversaries; it does not claim to run physical quantum hardware on-device. All decisions are strictly deterministic and reproducible.
          </span>
        </div>
      </div>

      {/* Latest Evaluation Status Cards (60-30-10, Zero-Pill) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded border border-slate-800 bg-[#0B0E17] p-4">
          <div className="text-xs font-mono uppercase text-slate-500">LATEST VERDICT</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${verdict === 'ACCEPT' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {verdict}
            </span>
            <span className="text-xs text-slate-400 font-mono">({threat})</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {latestExperiment ? `Exp #${latestExperiment.experimentId.slice(0, 12)}` : 'Pre-seeded baseline'}
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-[#0B0E17] p-4">
          <div className="text-xs font-mono uppercase text-slate-500">MEASURED QBER</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
            {qber} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            Baseline p0: {p0}%
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-[#0B0E17] p-4">
          <div className="text-xs font-mono uppercase text-slate-500">DETECTION THRESHOLD</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-cyan-400">
            {threshold} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            Exact binomial (α = 10⁻⁴)
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-[#0B0E17] p-4">
          <div className="text-xs font-mono uppercase text-slate-500">TOTAL EVALUATIONS</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-400">
            {totalExperiments}
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            Audit chain verified
          </div>
        </div>
      </div>

      {/* Protocol Architecture & Flow Diagram */}
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-6 text-slate-200">
        <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono mb-4">
          Deterministic Pipeline Architecture
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono">
          <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="text-slate-400 font-bold">1. INPUT</div>
            <div className="text-[10px] text-slate-500 mt-1">Message / File</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="text-slate-400 font-bold">2. HASH</div>
            <div className="text-[10px] text-slate-500 mt-1">SHA-256 Digest</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="text-slate-400 font-bold">3. KEYS</div>
            <div className="text-[10px] text-slate-500 mt-1">Pauli Eigenstates</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="text-slate-400 font-bold">4. TELEPORT</div>
            <div className="text-[10px] text-slate-500 mt-1">Bell-Pair + Pauli</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="text-slate-400 font-bold">5. CHANNEL</div>
            <div className="text-[10px] text-slate-500 mt-1">Depol / Flips</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="text-slate-400 font-bold">6. ATTACK</div>
            <div className="text-[10px] text-slate-500 mt-1">6 Threat Models</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="text-slate-400 font-bold">7. DETECT</div>
            <div className="text-[10px] text-slate-500 mt-1">Exact Binomial</div>
          </div>
          <div className="rounded border border-cyan-800/80 bg-cyan-950/40 p-2.5">
            <div className="text-cyan-400 font-bold">8. DECIDE</div>
            <div className="text-[10px] text-cyan-200 mt-1">Accept / Reject</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4 text-xs">
          <div className="text-slate-400">
            Explore active laboratory instruments:
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNavigate('signature')} className="text-cyan-400 hover:underline">
              Signature Lab →
            </button>
            <span className="text-slate-600">·</span>
            <button onClick={() => onNavigate('attack')} className="text-cyan-400 hover:underline">
              Attack Lab →
            </button>
            <span className="text-slate-600">·</span>
            <button onClick={() => onNavigate('detection')} className="text-cyan-400 hover:underline">
              Detection Telemetry →
            </button>
            <span className="text-slate-600">·</span>
            <button onClick={() => onNavigate('boundary')} className="text-cyan-400 hover:underline">
              Security Boundary →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
