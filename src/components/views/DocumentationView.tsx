import React from 'react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 text-slate-200">
        <div className="text-xs font-mono text-cyan-400">TECHNICAL & SCIENTIFIC DOCUMENTATION</div>
        <h1 className="text-xl font-bold text-white mt-1">QuantumShield Protocol & Statistical Architecture</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete mathematical reference, threat taxonomy, exact binomial formulas, sequential testing derivations, and scientific honesty principles.
        </p>
      </div>

      <div className="space-y-6 font-mono text-xs text-slate-300">
        {/* Section 1 */}
        <div className="rounded border border-slate-800 bg-[#0B0E17] p-6 space-y-3">
          <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            1. Mathematical Derivations & Core Equations
          </h2>

          <div className="space-y-4 text-xs leading-relaxed">
            <div>
              <div className="text-white font-semibold mb-1">A. Quantum Bit Error Rate (QBER)</div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-cyan-300">
                QBER = k / n = (Number of observed measurement mismatches) / (Total verified qubits)
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-1">B. Exact Binomial Hypothesis Test</div>
              <p className="text-slate-400 mb-2">
                Under the null hypothesis H0 (honest noisy quantum channel), the mismatch count X follows X ~ Binomial(n, p0). 
                The exact upper-tail cumulative probability is given by the regularized incomplete beta function:
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-cyan-300">
                P(X ≥ k | n, p0) = ∑_{'{'}j=k{'}'}^n C(n, j) p0^j (1 - p0)^(n - j) = I_{'{'}p0{'}'}(k, n - k + 1)
              </div>
              <p className="text-slate-400 mt-2">
                Evaluated with machine precision using Lentz's continued fraction expansion:
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-slate-300 text-[11px]">
                I_x(a, b) = [x^a (1-x)^b / (a B(a, b))] · [ 1 / (1 + d1 / (1 + d2 / ...)) ]
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-1">C. Critical Threshold Calculation</div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-cyan-300">
                t = min {'{'} m ∈ [0, n+1] : P(X ≥ m | n, p0) ≤ α {'}'}
              </div>
              <p className="text-slate-400 mt-1">
                Found in O(log n) time via binary search over [0, n+1] with exact incomplete beta evaluations.
              </p>
            </div>

            <div>
              <div className="text-white font-semibold mb-1">D. Wald's Sequential Probability Ratio Test (SPRT)</div>
              <p className="text-slate-400 mb-1">
                Tests H0: p = p0 versus H1: p = p1 = p0 + Δ. Stopping boundaries:
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-cyan-300">
                A = ln((1 - β) / α) [Rejection boundary], &nbsp; B = ln(β / (1 - α)) [Acceptance boundary]
              </div>
              <p className="text-slate-400 mt-2">
                For sequential observation sequence x1, ..., xm ∈ {'{0, 1}'} (1 = mismatch, 0 = match):
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-slate-300 text-[11px]">
                Λ_m = ∑_{'{'}i=1{'}'}^m [ x_i · ln(p1 / p0) + (1 - x_i) · ln((1 - p1) / (1 - p0)) ]
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-1">E. Sample Size Estimation (Parameter Advisor)</div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-cyan-300">
                n ≈ [ (z_{'{1-α}'} · √(p0(1 - p0)) + z_{'{1-β}'} · √(p1(1 - p1))) / (p1 - p0) ]²
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="rounded border border-slate-800 bg-[#0B0E17] p-6 space-y-3">
          <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            2. Threat Model & Attack Taxonomy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded bg-slate-900/60 p-3 border border-slate-800 space-y-1">
              <div className="text-white font-bold">1. Forgery</div>
              <p className="text-slate-400 text-[11px]">
                Adversary generates forged signatures without private key information. Induces ~50% QBER on projective basis checks.
              </p>
            </div>
            <div className="rounded bg-slate-900/60 p-3 border border-slate-800 space-y-1">
              <div className="text-white font-bold">2. Signer Impersonation</div>
              <p className="text-slate-400 text-[11px]">
                Adversary attempts to pose as the legitimate signer Alice by substituting self-prepared states during transmission.
              </p>
            </div>
            <div className="rounded bg-slate-900/60 p-3 border border-slate-800 space-y-1">
              <div className="text-white font-bold">3. Cryptographic Replay</div>
              <p className="text-slate-400 text-[11px]">
                Re-submission of a captured valid signature. Quantum statistics match honest baseline, but blocked by the Nonce Registry.
              </p>
            </div>
            <div className="rounded bg-slate-900/60 p-3 border border-slate-800 space-y-1">
              <div className="text-white font-bold">4. Unauthorized Verification</div>
              <p className="text-slate-400 text-[11px]">
                Unregistered verifier attempting state verification. Blocked unconditionally at classical verifier registry layer.
              </p>
            </div>
            <div className="rounded bg-slate-900/60 p-3 border border-slate-800 space-y-1">
              <div className="text-white font-bold">5. Intercept-Resend</div>
              <p className="text-slate-400 text-[11px]">
                Eavesdropper intercepts fraction f of qubits, measures in random basis, and re-transmits. Introduces excess QBER Δ = (1/3)f.
              </p>
            </div>
            <div className="rounded bg-slate-900/60 p-3 border border-slate-800 space-y-1">
              <div className="text-white font-bold">6. Adaptive Stealth Attacker</div>
              <p className="text-slate-400 text-[11px]">
                Red-team attacker tuning strength f to hug the threshold boundary without triggering detection.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="rounded border border-slate-800 bg-[#0B0E17] p-6 space-y-3">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
            3. Scientific Honesty & Limitations
          </h2>
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <p>
              • <strong>Deterministic Simulation:</strong> All quantum operations (teleportation, Pauli gates, projective measurements) are simulated in software. They reflect exact physical state vector transitions but do not execute on physical cryo-cooled quantum processors.
            </p>
            <p>
              • <strong>No Unconditional Real-World Security Claims:</strong> Security bounds are mathematically valid under the specified threat and channel noise models. Real-world implementations require calibrated hardware dark count rates, detector efficiency mismatch checks, and authenticated classical channels.
            </p>
            <p>
              • <strong>Deterministic Decision Separation:</strong> Machine learning and generative AI models are strictly prohibited from altering or deciding verdicts. Explanations are derived exclusively from structured detector facts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
