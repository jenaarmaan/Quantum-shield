import React, { useState } from 'react';
import { AttackType } from '../../lib/attacks/attacks';

interface AttackLabViewProps {
  onExecuteAttack: (params: {
    attackType: AttackType;
    attackStrength: number;
  }) => void;
}

export const AttackLabView: React.FC<AttackLabViewProps> = ({ onExecuteAttack }) => {
  const [selectedAttack, setSelectedAttack] = useState<AttackType>('intercept_resend');
  const [attackStrength, setAttackStrength] = useState(0.20);

  const attacksList: {
    id: AttackType;
    title: string;
    badge: string;
    description: string;
    physics: string;
    expectedQBER: string;
    tunable: boolean;
  }[] = [
    {
      id: 'intercept_resend',
      title: 'Intercept-Resend (Eavesdropping)',
      badge: 'QUANTUM CHANNEL ATTACK',
      description: 'Adversary Eve intercepts fraction f of the quantum carrier states, performs projective measurement in a randomly guessed basis, and resends the resulting collapsed eigenstate.',
      physics: 'Introduces expected excess QBER Delta = (1/3)*f for 3-basis Pauli alphabet.',
      expectedQBER: 'Baseline p0 + (1/3)*f (e.g. ~8% at f=0.20)',
      tunable: true
    },
    {
      id: 'forgery',
      title: 'Blind Forgery',
      badge: 'PRIVATE KEY SUBSTITUTION',
      description: 'Adversary attempts to forge a signature for message M\' without having access to Alice\'s legitimate private Pauli eigenstates.',
      physics: 'Eve must blindly guess eigenstate bases. With verifier checking in Alice\'s declared basis, 50% mismatch occurs.',
      expectedQBER: '~50.0% Mismatch Rate',
      tunable: false
    },
    {
      id: 'impersonation',
      title: 'Signer Impersonation',
      badge: 'ENTITY AUTHENTICATION ATTACK',
      description: 'Adversary pretends to be the legitimate signer Alice by substituting self-prepared quantum states during transmission.',
      physics: 'States generated without correlation to distributed Bell-pairs collapse upon projective verification.',
      expectedQBER: '~50.0% Mismatch Rate',
      tunable: false
    },
    {
      id: 'replay',
      title: 'Cryptographic Replay',
      badge: 'CLASSICAL REGISTRY ATTACK',
      description: 'Adversary captures a previously accepted, legitimate signature packet and attempts to submit it to a fresh verifier or session.',
      physics: 'Quantum bit error rate remains low and honest, but the reused nonce is caught by the Classical Nonce Registry.',
      expectedQBER: 'Identical to honest (~1.3%), blocked by Nonce Registry',
      tunable: false
    },
    {
      id: 'unauthorized_verification',
      title: 'Unauthorized Verifier',
      badge: 'ACCESS CONTROL BREACH',
      description: 'An unregistered verifier entity or adversary tries to verify the signature without valid authorization credentials in the Verifier Registry.',
      physics: 'Blocked unconditionally at the classical registry access control layer before quantum measurement acceptance.',
      expectedQBER: 'Blocked by Verifier Registry',
      tunable: false
    },
    {
      id: 'stealth',
      title: 'Adaptive Stealth Attacker',
      badge: 'RED-TEAM ADVERSARY',
      description: 'Adversary observes the configured detection threshold and adaptively tunes attack strength f to stay just beneath the boundary.',
      physics: 'Evaluates red-team adversarial capacity. Tests detector false acceptance rate under boundary-hugging conditions.',
      expectedQBER: 'Marginally below threshold t (e.g. ~3.5%)',
      tunable: true
    }
  ];

  const activeAttack = attacksList.find((a) => a.id === selectedAttack) || attacksList[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400">RED-TEAM ATTACK LABORATORY</div>
            <h1 className="text-xl font-bold text-white mt-1">Controlled Threat Modeling Suite</h1>
            <p className="text-xs text-slate-400 mt-1">
              Inject controlled adversaries to evaluate protocol resilience, test classical registry safeguards, and compute empirical detection power.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-500">THREAT SCOPE:</span>
            <div className="text-xs font-mono text-amber-400 font-bold">6 ISOLATED SCENARIOS</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attack Selectors */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono text-slate-400 uppercase font-semibold">
            Select Threat Scenario to Inject:
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {attacksList.map((atk) => {
              const isSelected = selectedAttack === atk.id;
              return (
                <div
                  key={atk.id}
                  onClick={() => setSelectedAttack(atk.id)}
                  className={`cursor-pointer rounded border p-4 transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/20 text-white shadow-sm'
                      : 'border-slate-800 bg-[#0B0E17] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200">{atk.title}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{atk.badge}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{atk.description}</p>
                  <div className="mt-2 text-[11px] font-mono text-cyan-400">
                    Expected QBER impact: {atk.expectedQBER}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Parameters & Launch Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 space-y-4">
            <div className="text-xs font-semibold text-slate-300 font-mono uppercase">
              Threat Parameters & Execution
            </div>

            <div className="rounded bg-slate-900/80 p-3 border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-500">SELECTED ATTACK:</div>
              <div className="text-white font-bold">{activeAttack.title}</div>
              <div className="text-slate-400 text-[11px] mt-1">{activeAttack.physics}</div>
            </div>

            {activeAttack.tunable ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">ATTACK STRENGTH (f):</span>
                  <span className="text-amber-400 font-bold tabular-nums">{(attackStrength * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  value={attackStrength}
                  onChange={(e) => setAttackStrength(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>1% (Minimal eavesdropping)</span>
                  <span>20% (Standard test)</span>
                  <span>100% (Full interception)</span>
                </div>
              </div>
            ) : (
              <div className="rounded bg-slate-900/40 p-2.5 text-xs font-mono text-slate-400 border border-slate-800">
                This attack has a fixed physical profile and evaluates deterministic structural/registry detection.
              </div>
            )}

            <button
              onClick={() => onExecuteAttack({ attackType: selectedAttack, attackStrength })}
              className="w-full rounded bg-rose-600 py-3 text-xs font-bold text-white transition-colors hover:bg-rose-500 active:scale-[0.98] uppercase tracking-wider font-mono shadow-sm"
            >
              Inject Threat & Execute Detection →
            </button>
          </div>

          <div className="rounded border border-slate-800 bg-[#0B0E17] p-4 text-xs font-mono text-slate-400 space-y-2">
            <div className="text-slate-200 font-semibold uppercase">Scientific Integrity Principle:</div>
            <p className="text-[11px] leading-relaxed">
              QuantumShield distinguishes between calibrated honest channel noise and adversary-induced disturbances. No attack produces arbitrary random results; all outcomes follow the exact projective measurement statistics of the modeled quantum states.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
