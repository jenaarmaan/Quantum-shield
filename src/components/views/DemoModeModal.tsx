import React, { useState } from 'react';
import { globalExperimentService, StoredExperiment } from '../../lib/storage/experimentStore';
import { AttackType } from '../../lib/attacks/attacks';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExperiment: (exp: StoredExperiment) => void;
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  isOpen,
  onClose,
  onSelectExperiment
}) => {
  const [step, setStep] = useState<number>(1);
  const [docChoice, setDocChoice] = useState<string>('FINANCIAL_PAYLOAD');
  const [attackChoice, setAttackChoice] = useState<AttackType>('intercept_resend');
  const [attackStrength, setAttackStrength] = useState<number>(0.25);
  const [demoExp, setDemoExp] = useState<StoredExperiment | null>(null);

  if (!isOpen) return null;

  const sampleDocs: Record<string, string> = {
    FINANCIAL_PAYLOAD: 'SWIFT MT-103: Transfer USD 45,000,000 from Bank of America (US) to Barclays (UK). Authenticated by QuantumShield Vector #9021',
    SATELLITE_TELEMETRY: 'Orbital Telemetry Vector: GEO-Sat Alpha-7 Ephemeris Update, Delta-V: +12.4 m/s, Epoch: 2026-10-05T12:00:00Z',
    BIOTECH_GENOME: 'CRISPR Guide RNA Vector Target: 5-CTAGATCGATCGATCGATCG-3, Off-target threshold: <0.001, Protocol QDS-v1.0'
  };

  const handleRunDemo = () => {
    const text = sampleDocs[docChoice];
    const exp = globalExperimentService.runSimulation({
      message: text,
      nQubits: 1000,
      noiseRate: 0.02,
      attackType: attackChoice,
      attackStrength: attackStrength,
      seed: 8888,
      experimentId: `demo_${Date.now()}`
    });
    setDemoExp(exp);
    setStep(3); // Go to results
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-slate-800 bg-[#0B0E17] p-6 shadow-2xl text-slate-200 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">QUANTUMSHIELD DEMO MODE</span>
            <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-800">
              REAL ENGINE OUTPUTS
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Step Indicator */}
        <div className="mt-4 flex items-center justify-between border-b border-slate-800/80 pb-3 text-[11px] text-slate-400">
          <span className={step === 1 ? 'text-cyan-400 font-bold' : ''}>1. Document</span>
          <span>→</span>
          <span className={step === 2 ? 'text-cyan-400 font-bold' : ''}>2. Attack Threat</span>
          <span>→</span>
          <span className={step === 3 ? 'text-cyan-400 font-bold' : ''}>3. Evaluation Result</span>
        </div>

        {/* Step 1: Select Document */}
        {step === 1 && (
          <div className="mt-4 space-y-4">
            <div className="text-slate-300 font-semibold uppercase">Select Sample Document to Sign:</div>
            <div className="space-y-2">
              {Object.keys(sampleDocs).map((key) => (
                <div
                  key={key}
                  onClick={() => setDocChoice(key)}
                  className={`cursor-pointer rounded border p-3 transition-colors ${
                    docChoice === key
                      ? 'border-cyan-500 bg-cyan-950/20 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-cyan-300">{key}</div>
                  <div className="mt-1 text-[11px] text-slate-300 truncate">{sampleDocs[key]}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                className="rounded bg-cyan-500 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-400"
              >
                Proceed to Threat Injection →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Attack */}
        {step === 2 && (
          <div className="mt-4 space-y-4">
            <div className="text-slate-300 font-semibold uppercase">Select Threat to Inject:</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'Honest Channel (No Attack)' },
                { id: 'intercept_resend', label: 'Intercept-Resend (25%)' },
                { id: 'forgery', label: 'Blind Forgery' },
                { id: 'replay', label: 'Nonce Replay' }
              ].map((atk) => (
                <div
                  key={atk.id}
                  onClick={() => setAttackChoice(atk.id as any)}
                  className={`cursor-pointer rounded border p-3 transition-colors ${
                    attackChoice === atk.id
                      ? 'border-cyan-500 bg-cyan-950/20 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-white">{atk.label}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-700"
              >
                ← Back
              </button>
              <button
                onClick={handleRunDemo}
                className="rounded bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-500"
              >
                Launch Attack & Detect →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results Preview */}
        {step === 3 && demoExp && (
          <div className="mt-4 space-y-4">
            <div className="rounded border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">VERDICT:</span>
                <span className={`text-lg font-bold ${demoExp.results.verdict === 'ACCEPT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {demoExp.results.verdict}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">THREAT:</span>
                <span className="text-white font-bold">{demoExp.results.threatType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">OBSERVED QBER:</span>
                <span className="text-white font-bold">{(demoExp.results.qber * 100).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">THRESHOLD:</span>
                <span className="text-amber-400 font-bold">{(demoExp.results.thresholdRate * 100).toFixed(2)}%</span>
              </div>
            </div>

            <div className="rounded bg-slate-900/80 p-3 text-[11px] text-slate-300 border border-slate-800">
              <div className="text-cyan-400 font-bold mb-1">DETERMINISTIC EXPLANATION:</div>
              {demoExp.results.explanation}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-700"
              >
                Run Another Demo
              </button>
              <button
                onClick={() => {
                  onSelectExperiment(demoExp);
                  onClose();
                }}
                className="rounded bg-cyan-500 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-400"
              >
                Open Full Telemetry Inspector →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
