import React, { useState } from 'react';
import { ParameterAdvisor, AdvisorRecommendation } from '../../lib/advisor/advisor';

export const ParameterAdvisorView: React.FC = () => {
  const [noiseRate, setNoiseRate] = useState(0.02);
  const [targetFAR, setTargetFAR] = useState(1e-4);
  const [targetFRR, setTargetFRR] = useState(1e-4);
  const [attackStrength, setAttackStrength] = useState(0.20);

  const recommendation: AdvisorRecommendation = ParameterAdvisor.advise({
    noiseRate,
    targetFAR,
    targetFRR,
    attackStrength
  });

  return (
    <div className="space-y-6">
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400">PARAMETER ADVISOR</div>
            <h1 className="text-xl font-bold text-white mt-1">Security Parameter & Sample Size Synthesizer</h1>
            <p className="text-xs text-slate-400 mt-1">
              Computes mathematically rigorous sample sizes (qubit counts) and rejection thresholds based on asymptotic hypothesis testing constraints.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-500">METHODOLOGY:</span>
            <div className="text-xs font-mono text-cyan-400 font-bold">THEORETICAL EXPANSION</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 space-y-4 font-mono text-xs">
            <div className="text-slate-300 font-semibold uppercase">Operating Constraints:</div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Channel Noise Rate (ε):</span>
                <span className="text-cyan-400 font-bold tabular-nums">{(noiseRate * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0.002}
                max={0.10}
                step={0.002}
                value={noiseRate}
                onChange={(e) => setNoiseRate(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Target False Acceptance Rate (FAR, α):</span>
                <span className="text-white font-bold tabular-nums">{targetFAR.toExponential(0)}</span>
              </div>
              <select
                value={targetFAR}
                onChange={(e) => setTargetFAR(Number(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-white"
              >
                <option value={1e-2}>10⁻² (1 in 100)</option>
                <option value={1e-4}>10⁻⁴ (1 in 10,000 - Standard)</option>
                <option value={1e-6}>10⁻⁶ (1 in 1,000,000 - High)</option>
                <option value={1e-8}>10⁻⁸ (1 in 100,000,000 - Extreme)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Target False Rejection Rate (FRR, β):</span>
                <span className="text-white font-bold tabular-nums">{targetFRR.toExponential(0)}</span>
              </div>
              <select
                value={targetFRR}
                onChange={(e) => setTargetFRR(Number(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-white"
              >
                <option value={1e-2}>10⁻² (1 in 100)</option>
                <option value={1e-4}>10⁻⁴ (1 in 10,000)</option>
                <option value={1e-6}>10⁻⁶ (1 in 1,000,000)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Minimum Modeled Attack Strength (f):</span>
                <span className="text-amber-400 font-bold tabular-nums">{(attackStrength * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.50}
                step={0.01}
                value={attackStrength}
                onChange={(e) => setAttackStrength(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 space-y-4 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold uppercase">Recommended Architecture:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                recommendation.operatingRegion === 'DETECTABLE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {recommendation.operatingRegion}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-xs text-slate-500 uppercase">Recommended Qubit Count (N)</div>
                <div className="mt-2 text-2xl font-bold text-white tabular-nums">
                  {recommendation.recommendedNQubits.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Overhead: <strong className="text-cyan-400">{recommendation.tradeOffs.qubitOverhead}</strong>
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-xs text-slate-500 uppercase">Detection Threshold (t)</div>
                <div className="mt-2 text-2xl font-bold text-amber-400 tabular-nums">
                  {(recommendation.thresholdRate * 100).toFixed(2)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Count: {recommendation.thresholdCount} mismatches
                </div>
              </div>
            </div>

            <div className="rounded border border-slate-800 bg-slate-900/40 p-4 space-y-2 text-xs text-slate-300">
              <div className="text-slate-400 uppercase text-[11px]">Statistical Derivation Facts:</div>
              <div>• Honest Baseline Mismatch (p0): <strong className="text-white">{(recommendation.p0Honest * 100).toFixed(2)}%</strong></div>
              <div>• Expected Adversary Mismatch (p1): <strong className="text-white">{(recommendation.p1Attack * 100).toFixed(2)}%</strong> (Δ = +{(recommendation.deltaQBER * 100).toFixed(2)}%)</div>
              <div>• Detection Power (1 - β): <strong className="text-emerald-400">{recommendation.tradeOffs.detectionPower}</strong></div>
              <div>• Feasible in practical testbed: <strong className={recommendation.feasible ? 'text-emerald-400' : 'text-amber-400'}>{recommendation.feasible ? 'YES' : 'MARGINAL'}</strong></div>
            </div>

            <div className="rounded bg-slate-900/80 p-3 text-[11px] text-slate-400 border border-slate-800 leading-relaxed">
              <strong className="text-slate-200">Scientific Honesty Principle:</strong> This output is an analytic asymptotic derivation based on normal expansion of binomial tails. While mathematically rigorous, all configurations should be experimentally benchmarked in the Experiment Runner prior to high-assurance deployment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
