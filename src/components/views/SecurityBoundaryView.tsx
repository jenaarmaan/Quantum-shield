import React, { useState } from 'react';
import { BoundaryChart } from '../charts/BoundaryChart';

export const SecurityBoundaryView: React.FC = () => {
  const [nQubits, setNQubits] = useState(1000);
  const [testNoise, setTestNoise] = useState(0.02);
  const [testAttack, setTestAttack] = useState(0.20);

  return (
    <div className="space-y-6">
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400">SECURITY BOUNDARY MAPPING</div>
            <h1 className="text-xl font-bold text-white mt-1">Multi-Dimensional Boundary Space</h1>
            <p className="text-xs text-slate-400 mt-1">
              Visualizes the operational boundary between honest channel noise (H0) and detectable adversary disturbance (H1).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Qubit Scale:</span>
            <select
              value={nQubits}
              onChange={(e) => setNQubits(Number(e.target.value))}
              className="rounded border border-slate-700 bg-slate-900 p-1.5 text-xs text-white"
            >
              <option value={200}>200 Qubits</option>
              <option value={500}>500 Qubits</option>
              <option value={1000}>1,000 Qubits</option>
              <option value={2000}>2,000 Qubits</option>
              <option value={5000}>5,000 Qubits</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <BoundaryChart
            nQubits={nQubits}
            currentNoise={testNoise}
            currentAttack={testAttack}
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 space-y-4 text-xs font-mono">
            <div className="text-slate-200 font-semibold uppercase">Probe Operating Point:</div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Channel Noise (ε):</span>
                <span className="text-cyan-400 font-bold tabular-nums">{(testNoise * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0.005}
                max={0.20}
                step={0.005}
                value={testNoise}
                onChange={(e) => setTestNoise(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Attack Strength (f):</span>
                <span className="text-amber-400 font-bold tabular-nums">{(testAttack * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={1.0}
                step={0.01}
                value={testAttack}
                onChange={(e) => setTestAttack(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="rounded bg-slate-900/60 p-3 border border-slate-800 space-y-1.5 text-slate-300">
              <div className="text-[11px] text-slate-500 uppercase">Region Definitions:</div>
              <div><strong className="text-emerald-400">SAFE:</strong> Attack disturbance remains below statistical resolution; indistinguishable from honest baseline variation.</div>
              <div><strong className="text-cyan-400">DETECTABLE:</strong> Signal-to-noise ratio guarantees statistical rejection with detection power P ≥ 95%.</div>
              <div><strong className="text-amber-400">AMBIGUOUS:</strong> Finite sample size overlap between H0 and H1 prevents guaranteed α, β separation.</div>
              <div><strong className="text-rose-400">UNRELIABLE:</strong> Noise exceeds channel threshold or destroys protocol security bounds.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
