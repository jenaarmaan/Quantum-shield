import React, { useState } from 'react';
import { SecurityBoundaryEngine, SecurityBoundaryPoint } from '../../lib/advisor/advisor';

interface BoundaryChartProps {
  nQubits?: number;
  currentNoise?: number;
  currentAttack?: number;
}

export const BoundaryChart: React.FC<BoundaryChartProps> = ({
  nQubits = 1000,
  currentNoise = 0.02,
  currentAttack = 0.20
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<SecurityBoundaryPoint | null>(null);

  const noiseTicks = [0.005, 0.02, 0.05, 0.08, 0.12, 0.16, 0.20];
  const attackTicks = [0.05, 0.20, 0.40, 0.60, 0.80, 1.00];

  const grid = SecurityBoundaryEngine.generateGrid(nQubits);

  const width = 640;
  const height = 360;
  const padLeft = 60;
  const padBottom = 40;
  const padTop = 20;
  const padRight = 30;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const maxNoise = 0.20;
  const maxAttack = 1.0;

  const scaleX = (noise: number) => padLeft + (noise / maxNoise) * plotWidth;
  const scaleY = (attack: number) => padTop + plotHeight - (attack / maxAttack) * plotHeight;

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'DETECTABLE':
        return '#06B6D4'; // laser cyan
      case 'SAFE':
        return '#10B981'; // emerald
      case 'AMBIGUOUS':
        return '#F59E0B'; // amber
      default:
        return '#E11D48'; // rose
    }
  };

  return (
    <div className="relative w-full rounded border border-slate-800 bg-[#0B0E17] p-4 text-slate-200">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-300">SECURITY BOUNDARY MAP</span>
          <span className="font-mono text-slate-500 tabular-nums">N = {nQubits} QUBITS</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10B981]" /> Safe (&lt;2%)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#06B6D4]" /> Detectable (&gt;95%)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Ambiguous</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#E11D48]" /> Unreliable</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        {/* Axes background grid */}
        {noiseTicks.map((nt) => {
          const x = scaleX(nt);
          return (
            <g key={`x-grid-${nt}`}>
              <line x1={x} y1={padTop} x2={x} y2={padTop + plotHeight} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
              <text x={x} y={padTop + plotHeight + 16} fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="middle">
                {(nt * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}

        {attackTicks.map((at) => {
          const y = scaleY(at);
          return (
            <g key={`y-grid-${at}`}>
              <line x1={padLeft} y1={y} x2={padLeft + plotWidth} y2={y} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padLeft - 8} y={y + 3} fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="end">
                {(at * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* Boundary Area Hull or Grid Points */}
        {grid.map((pt, idx) => {
          const cx = scaleX(pt.noiseRate);
          const cy = scaleY(pt.attackStrength);
          const color = getRegionColor(pt.region);
          const isHovered = hoveredPoint?.noiseRate === pt.noiseRate && hoveredPoint?.attackStrength === pt.attackStrength;

          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={isHovered ? 6 : 4}
              fill={color}
              fillOpacity={0.7}
              stroke={isHovered ? '#FFFFFF' : color}
              strokeWidth={isHovered ? 2 : 1}
              className="cursor-crosshair transition-all"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}

        {/* Operating Point marker */}
        {currentNoise !== undefined && currentAttack !== undefined && (
          <g>
            <circle
              cx={scaleX(currentNoise)}
              cy={scaleY(currentAttack)}
              r="8"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              className="animate-pulse"
            />
            <circle
              cx={scaleX(currentNoise)}
              cy={scaleY(currentAttack)}
              r="3"
              fill="#38BDF8"
            />
            <text
              x={scaleX(currentNoise) + 12}
              y={scaleY(currentAttack) - 6}
              fill="#38BDF8"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
            >
              ACTIVE RUN
            </text>
          </g>
        )}

        {/* Axis labels */}
        <text
          x={padLeft + plotWidth / 2}
          y={height - 6}
          fill="#94A3B8"
          fontSize="11"
          fontFamily="monospace"
          textAnchor="middle"
        >
          CHANNEL NOISE RATE (ε)
        </text>
        <text
          x={14}
          y={padTop + plotHeight / 2}
          fill="#94A3B8"
          fontSize="11"
          fontFamily="monospace"
          textAnchor="middle"
          transform={`rotate(-90, 14, ${padTop + plotHeight / 2})`}
        >
          ATTACK STRENGTH (f)
        </text>
      </svg>

      {/* Hover Tooltip HUD */}
      {hoveredPoint && (
        <div className="mt-3 rounded border border-slate-700 bg-slate-900/90 p-2.5 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-cyan-400">POINT INSPECTOR</span>
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-black" style={{ backgroundColor: getRegionColor(hoveredPoint.region) }}>
              {hoveredPoint.region}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
            <div>Noise (ε): <span className="text-white font-bold">{(hoveredPoint.noiseRate * 100).toFixed(1)}%</span></div>
            <div>Attack (f): <span className="text-white font-bold">{(hoveredPoint.attackStrength * 100).toFixed(0)}%</span></div>
            <div>Honest p0: <span className="text-white font-bold">{(hoveredPoint.p0 * 100).toFixed(2)}%</span></div>
            <div>Expected p1: <span className="text-white font-bold">{(hoveredPoint.p1 * 100).toFixed(2)}%</span></div>
            <div>Detection Power: <span className="text-white font-bold">{(hoveredPoint.detectionPower * 100).toFixed(1)}%</span></div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">{hoveredPoint.description}</div>
        </div>
      )}
    </div>
  );
};
