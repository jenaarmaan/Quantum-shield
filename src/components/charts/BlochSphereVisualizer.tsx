import React, { useState } from 'react';
import { PAULI_EIGENSTATES } from '../../lib/quantum/states';

interface BlochSphereVisualizerProps {
  selectedBasis?: string;
  selectedBit?: number;
}

export const BlochSphereVisualizer: React.FC<BlochSphereVisualizerProps> = ({
  selectedBasis = 'Z',
  selectedBit = 0
}) => {
  const [activeKey, setActiveKey] = useState<string>(`${selectedBasis.toUpperCase()}${selectedBit}`);

  const activeState = PAULI_EIGENSTATES[activeKey] || PAULI_EIGENSTATES['Z0'];
  const { x, y, z } = activeState.blochCoordinates();

  // Projection math for isometric 2.5D view of the Bloch sphere
  const centerX = 140;
  const centerY = 130;
  const radius = 80;

  // Project (x, y, z) into 2D isometric plane
  // X axis points down-left (+30 deg)
  // Y axis points down-right (+330 deg)
  // Z axis points straight up (+90 deg)
  const projX = (xVal: number, yVal: number) => {
    return centerX + radius * (yVal * Math.cos(Math.PI / 6) - xVal * Math.cos(Math.PI / 6));
  };

  const projY = (xVal: number, yVal: number, zVal: number) => {
    return centerY - radius * (zVal - 0.5 * (xVal * Math.sin(Math.PI / 6) + yVal * Math.sin(Math.PI / 6)));
  };

  const vectorHeadX = projX(x, y);
  const vectorHeadY = projY(x, y, z);

  const poles = [
    { label: '|0⟩ (+Z)', x: 0, y: 0, z: 1, key: 'Z0', color: '#38BDF8' },
    { label: '|1⟩ (-Z)', x: 0, y: 0, z: -1, key: 'Z1', color: '#0284C7' },
    { label: '|+⟩ (+X)', x: 1, y: 0, z: 0, key: 'X0', color: '#06B6D4' },
    { label: '|−⟩ (-X)', x: -1, y: 0, z: 0, key: 'X1', color: '#0891B2' },
    { label: '|+i⟩ (+Y)', x: 0, y: 1, z: 0, key: 'Y0', color: '#F59E0B' },
    { label: '|−i⟩ (-Y)', x: 0, y: -1, z: 0, key: 'Y1', color: '#D97706' }
  ];

  return (
    <div className="w-full rounded border border-slate-800 bg-[#0B0E17] p-4 text-slate-200">
      <div className="mb-3 flex flex-wrap items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">PAULI EIGENSTATE BLOCH SPHERE</span>
        <div className="font-mono text-[11px] text-slate-400">
          Bloch vector: ({x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)})
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* SVG Bloch Sphere */}
        <div className="relative flex justify-center">
          <svg width="280" height="250" viewBox="0 0 280 250" className="overflow-visible select-none">
            {/* Sphere outline */}
            <circle cx={centerX} cy={centerY} r={radius} fill="#0F172A" fillOpacity="0.4" stroke="#334155" strokeWidth="1.5" />
            <ellipse cx={centerX} cy={centerY} rx={radius} ry={radius * 0.3} fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
            <ellipse cx={centerX} cy={centerY} rx={radius * 0.3} ry={radius} fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />

            {/* Axes */}
            {/* Z axis (Vertical) */}
            <line x1={centerX} y1={centerY + radius + 10} x2={centerX} y2={centerY - radius - 15} stroke="#475569" strokeWidth="1" />
            <text x={centerX + 6} y={centerY - radius - 18} fill="#94A3B8" fontSize="10" fontFamily="monospace">+Z</text>

            {/* X axis */}
            <line x1={centerX} y1={centerY} x2={projX(1.2, 0)} y2={projY(1.2, 0, 0)} stroke="#475569" strokeWidth="1" />
            <text x={projX(1.3, 0)} y={projY(1.3, 0, 0)} fill="#94A3B8" fontSize="10" fontFamily="monospace">+X</text>

            {/* Y axis */}
            <line x1={centerX} y1={centerY} x2={projX(0, 1.2)} y2={projY(0, 1.2, 0)} stroke="#475569" strokeWidth="1" />
            <text x={projX(0, 1.3)} y={projY(0, 1.3, 0)} fill="#94A3B8" fontSize="10" fontFamily="monospace">+Y</text>

            {/* Poles */}
            {poles.map((p) => {
              const px = projX(p.x, p.y);
              const py = projY(p.x, p.y, p.z);
              const isActive = activeKey === p.key;

              return (
                <g key={p.key} className="cursor-pointer" onClick={() => setActiveKey(p.key)}>
                  <circle
                    cx={px}
                    cy={py}
                    r={isActive ? 6 : 4}
                    fill={p.color}
                    stroke={isActive ? '#FFFFFF' : p.color}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={px + (p.x < 0 ? -12 : 8)}
                    y={py + (p.z > 0 ? -6 : 10)}
                    fill={isActive ? '#FFFFFF' : '#94A3B8'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor={p.x < 0 ? 'end' : 'start'}
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}

            {/* Active State Vector Arrow */}
            <line
              x1={centerX}
              y1={centerY}
              x2={vectorHeadX}
              y2={vectorHeadY}
              stroke="#06B6D4"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={vectorHeadX} cy={vectorHeadY} r="5" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="1.5" />
          </svg>
        </div>

        {/* State Selector Matrix */}
        <div className="flex flex-col gap-2 w-full md:w-56 text-xs">
          <span className="text-[11px] font-mono uppercase text-slate-400">Select Pauli Eigenstate:</span>
          <div className="grid grid-cols-2 gap-1.5 font-mono">
            {poles.map((p) => (
              <button
                key={p.key}
                onClick={() => setActiveKey(p.key)}
                className={`rounded border px-2.5 py-1.5 text-left text-xs transition-colors ${
                  activeKey === p.key
                    ? 'border-cyan-500 bg-cyan-950/60 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-white">{p.key}</div>
                <div className="text-[10px] text-slate-400">{p.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-2 rounded bg-slate-900/80 p-2 font-mono text-[11px] text-slate-400 border border-slate-800">
            <div>Basis: <span className="text-white font-bold">{activeKey[0]}</span></div>
            <div>Bit: <span className="text-white font-bold">{activeKey[1]}</span></div>
            <div>Eigenvalue: <span className="text-cyan-400 font-bold">{activeKey[1] === '0' ? '+1' : '-1'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
