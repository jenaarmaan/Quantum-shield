import React from 'react';

interface TelemetryRibbonProps {
  statusText?: string;
  protocolName?: string;
  protocolVersion?: string;
  seed?: number;
  qubitCount?: number;
  activeVerdict?: string;
}

export const TelemetryRibbon: React.FC<TelemetryRibbonProps> = ({
  statusText = 'NOMINAL (CALIBRATED)',
  protocolName = 'Teleportation-QDS',
  protocolVersion = 'QDS-v1.0',
  seed = 1337,
  qubitCount = 1000,
  activeVerdict
}) => {
  return (
    <div className="flex h-8 w-full items-center justify-between border-b border-slate-800/80 bg-[#0B0E17] px-4 font-mono text-[11px] text-slate-400 md:px-8 overflow-x-auto whitespace-nowrap">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400">STATUS:</span>
          <span className="text-slate-200 font-bold">{statusText}</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">PROTOCOL:</span>
          <span className="text-slate-200">{protocolName} ({protocolVersion})</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-slate-500">ENGINE:</span>
          <span className="text-cyan-400">DETERMINISTIC SIMULATION</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">QUBITS:</span>
          <span className="text-white font-bold tabular-nums">{qubitCount}</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">SEED:</span>
          <span className="text-amber-400 font-bold tabular-nums">#{seed}</span>
        </div>
        {activeVerdict && (
          <>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">VERDICT:</span>
              <span className={`font-bold ${activeVerdict === 'ACCEPT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeVerdict}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
