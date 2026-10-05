import React from 'react';
import { SPRTResult } from '../../lib/detection/sprt';

interface SPRTChartProps {
  sprt?: SPRTResult;
}

export const SPRTChart: React.FC<SPRTChartProps> = ({ sprt }) => {
  if (!sprt || sprt.llrTrajectory.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded border border-slate-800 bg-[#0B0E17] text-xs font-mono text-slate-500">
        NO SEQUENTIAL SPRT DATA FOR CURRENT CONFIGURATION
      </div>
    );
  }

  const trajectory = sprt.llrTrajectory;
  const upperA = sprt.upperBoundaryA;
  const lowerB = sprt.lowerBoundaryB;

  const width = 640;
  const height = 260;
  const padLeft = 55;
  const padBottom = 35;
  const padTop = 25;
  const padRight = 30;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const minLLR = Math.min(lowerB * 1.15, Math.min(...trajectory));
  const maxLLR = Math.max(upperA * 1.15, Math.max(...trajectory));
  const rangeLLR = Math.max(1, maxLLR - minLLR);

  const scaleX = (idx: number) => padLeft + (idx / Math.max(1, trajectory.length - 1)) * plotWidth;
  const scaleY = (val: number) => padTop + plotHeight - ((val - minLLR) / rangeLLR) * plotHeight;

  // Build SVG path
  const points = trajectory.map((val, idx) => `${scaleX(idx).toFixed(1)},${scaleY(val).toFixed(1)}`).join(' ');

  const yA = scaleY(upperA);
  const yB = scaleY(lowerB);
  const yZero = scaleY(0);

  return (
    <div className="w-full rounded border border-slate-800 bg-[#0B0E17] p-4 text-slate-200">
      <div className="mb-2 flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">WALD SPRT LLR TRAJECTORY</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${sprt.verdict === 'REJECT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
            {sprt.verdict}
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Consumed <strong className="text-white">{sprt.samplesConsumed}</strong> / {sprt.maxSamples} bits ({((1 - sprt.samplesConsumed / sprt.maxSamples) * 100).toFixed(1)}% savings)
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        {/* Upper Boundary Line (A) */}
        <line x1={padLeft} y1={yA} x2={padLeft + plotWidth} y2={yA} stroke="#E11D48" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={padLeft + 8} y={yA - 6} fill="#E11D48" fontSize="10" fontFamily="monospace">
          UPPER REJECTION BOUNDARY A = {upperA.toFixed(2)}
        </text>

        {/* Lower Boundary Line (B) */}
        <line x1={padLeft} y1={yB} x2={padLeft + plotWidth} y2={yB} stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={padLeft + 8} y={yB + 14} fill="#10B981" fontSize="10" fontFamily="monospace">
          LOWER ACCEPTANCE BOUNDARY B = {lowerB.toFixed(2)}
        </text>

        {/* Zero baseline */}
        {yZero >= padTop && yZero <= padTop + plotHeight && (
          <line x1={padLeft} y1={yZero} x2={padLeft + plotWidth} y2={yZero} stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
        )}

        {/* Trajectory Path */}
        <polyline
          fill="none"
          stroke="#38BDF8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Final point marker */}
        {trajectory.length > 0 && (
          <circle
            cx={scaleX(trajectory.length - 1)}
            cy={scaleY(trajectory[trajectory.length - 1])}
            r="4.5"
            fill={sprt.verdict === 'REJECT' ? '#E11D48' : '#10B981'}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        )}

        {/* Axis Labels */}
        <text x={padLeft + plotWidth / 2} y={height - 4} fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="middle">
          SEQUENTIAL SAMPLES TESTED (BITS)
        </text>
        <text x={12} y={padTop + plotHeight / 2} fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90, 12, ${padTop + plotHeight / 2})`}>
          LOG-LIKELIHOOD RATIO (Λ)
        </text>
      </svg>
    </div>
  );
};
