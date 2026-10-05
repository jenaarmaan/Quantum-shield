import React, { useState } from 'react';
import { sha256Sync } from '../../lib/protocol/sha256';
import { BlochSphereVisualizer } from '../charts/BlochSphereVisualizer';

interface SignatureLabViewProps {
  onSignMessage: (params: {
    message: string;
    nQubits: number;
    noiseModel: 'depolarizing' | 'bit_flip' | 'phase_flip' | 'none';
    noiseRate: number;
    seed: number;
  }) => void;
}

export const SignatureLabView: React.FC<SignatureLabViewProps> = ({ onSignMessage }) => {
  const [inputText, setInputText] = useState('QuantumShield Secure Financial Authorization Vector #8492');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [nQubits, setNQubits] = useState(1000);
  const [noiseModel, setNoiseModel] = useState<'depolarizing' | 'bit_flip' | 'phase_flip' | 'none'>('depolarizing');
  const [noiseRate, setNoiseRate] = useState(0.02);
  const [seed, setSeed] = useState(1337);

  const hash = sha256Sync(inputText);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Safety checks: limit to 5MB for on-device processing
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit for client-side processing.');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text || '');
    };
    reader.readAsText(file);
  };

  const handleExecute = () => {
    onSignMessage({
      message: inputText,
      nQubits,
      noiseModel,
      noiseRate,
      seed
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400">SIGNATURE LABORATORY</div>
            <h1 className="text-xl font-bold text-white mt-1">Pauli Eigenstate Signature Synthesis</h1>
            <p className="text-xs text-slate-400 mt-1">
              Encodes arbitrary document content into SHA-256 digests, generates conjugate Pauli bases, and prepares Bell-pair teleportation packets.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-500">SIMULATION ENGINE:</span>
            <div className="text-xs font-mono text-emerald-400 font-bold">ACTIVE (LOCAL WASM/TS)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Message Input & File Loading */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded border border-slate-800 bg-[#0B0E17] p-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300 font-mono">1. DOCUMENT / MESSAGE INPUT</span>
              <label className="cursor-pointer text-cyan-400 hover:underline">
                Upload File
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {fileName && (
              <div className="mb-2 text-xs font-mono text-emerald-400 flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                <span>Loaded file: {fileName} ({(fileSize! / 1024).toFixed(1)} KB)</span>
                <button onClick={() => { setFileName(null); setFileSize(null); }} className="text-slate-500 hover:text-white">✕</button>
              </div>
            )}

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900/70 p-3 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="Enter document payload or transaction bytes..."
            />

            {/* SHA-256 Digest Output */}
            <div className="mt-3 rounded border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase">SHA-256 DIGEST (256 BITS):</div>
              <div className="text-xs font-mono text-cyan-300 break-all select-all mt-1">
                {hash}
              </div>
            </div>
          </div>

          {/* Protocol Configuration Parameters */}
          <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 space-y-4">
            <div className="text-xs font-semibold text-slate-300 font-mono">2. PROTOCOL & CHANNEL CONTROLS</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">SIGNATURE LENGTH (N):</label>
                <select
                  value={nQubits}
                  onChange={(e) => setNQubits(Number(e.target.value))}
                  className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value={100}>100 Qubits (Fast)</option>
                  <option value={500}>500 Qubits (Standard)</option>
                  <option value={1000}>1,000 Qubits (Recommended)</option>
                  <option value={2000}>2,000 Qubits (High Assurance)</option>
                  <option value={5000}>5,000 Qubits (Ultra-Secure)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">NOISE MODEL:</label>
                <select
                  value={noiseModel}
                  onChange={(e) => setNoiseModel(e.target.value as any)}
                  className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="depolarizing">Depolarizing (X, Y, Z symmetric)</option>
                  <option value="bit_flip">Bit-Flip (Pauli X)</option>
                  <option value="phase_flip">Phase-Flip (Pauli Z)</option>
                  <option value="none">Ideal (Zero Noise)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">CHANNEL NOISE RATE (ε):</span>
                <span className="text-cyan-400 font-bold tabular-nums">{(noiseRate * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.15}
                step={0.005}
                value={noiseRate}
                onChange={(e) => setNoiseRate(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0.0% (Clean)</span>
                <span>2.0% (Typical fiber)</span>
                <span>15.0% (Severe)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">DETERMINISTIC SEED:</span>
                <button
                  onClick={() => setSeed(Math.floor(Math.random() * 90000) + 1000)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Randomize
                </button>
              </div>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleExecute}
              className="w-full rounded bg-cyan-500 py-3 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-400 active:scale-[0.98] uppercase tracking-wider font-mono"
            >
              Sign Document & Distribute States →
            </button>
          </div>
        </div>

        {/* Right Column: Pauli State Visualization */}
        <div className="lg:col-span-6 space-y-5">
          <BlochSphereVisualizer selectedBasis="Z" selectedBit={0} />

          <div className="rounded border border-slate-800 bg-[#0B0E17] p-4 text-xs font-mono text-slate-400 space-y-2">
            <div className="text-slate-200 font-semibold uppercase">Mathematical Specification (QDS-v1.0):</div>
            <p className="text-[11px] leading-relaxed">
              • Private key comprises conjugate eigenstates sampled from {'{|0⟩, |1⟩, |+⟩, |−⟩, |+i⟩, |−i⟩'}.<br />
              • States are transmitted to verifiers via Bell-pair teleportation (|Φ⁺⟩).<br />
              • Channel noise model introduces stochastic Pauli transformations E(ρ) with probability ε.<br />
              • Each signature attaches a fresh 256-bit cryptographically unique nonce and UTC timestamp to guarantee replay immunity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
