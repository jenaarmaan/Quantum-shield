import React from 'react';

interface DistributionChartProps {
  nQubits: number;
  p0: number;
  mismatches: number;
  threshold: number;
  thresholdRate: number;
  qber: number;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  nQubits,
  p0,
  mismatches,
  threshold,
  thresholdRate,
  qber
}) => {
  const width = 640;
  const height = 220;
  const padLeft = 45;
  const padBottom = 35;
  const padTop = 20;
  const padRight = 30;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  // Mean & standard deviation of H0
  const mean0 = nQubits * p0;
  const std0 = Math.max(1, Math.sqrt(nQubits * p0 * (1 - p0)));

  // Display range for X axis: from max(0, mean0 - 3.5*std0) to max(threshold + 4*std0, mismatches + 3*std0)
  const minX = Math.max(0, Math.floor(mean0 - 3.5 * std0));
  const maxX = Math.max(Math.ceil(threshold + 3.5 * std0), mismatches + 10, minX + 20);
  const rangeX = maxX - minX;

  const scaleX = (x: number) => padLeft + ((x - minX) / rangeX) * plotWidth;

  // Gaussian PDF curve for H0
  const pointsCount = 100;
  const pdfPoints: { x: number; y: number }[] = [];
  let maxPdf = 0;

  for (let i = 0; i <= pointsCount; i++) {
    const xVal = minX + (i / pointsCount) * rangeX;
    const exponent = -0.5 * Math.pow((xVal - mean0) / std0, 2);
    const pdf = (1 / (std0 * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    if (pdf > maxPdf) maxPdf = pdf;
    pdfPoints.push({ x: xVal, y: pdf });
  }

  const scaleY = (pdf: number) => padTop + plotHeight - (pdf / (maxPdf * 1.15)) * plotHeight;

  const polylineStr = pdfPoints
    .map((p) => `${scaleX(p.x).toFixed(1)},${scaleY(p.y).toFixed(1)}`)
    .join(' ');

  // Shaded rejection tail area (from threshold to maxX)
  const tailPoints = pdfPoints
    .filter((p) => p.x >= threshold)
    .map((p) => `${scaleX(p.x).toFixed(1)},${scaleY(p.y).toFixed(1)}`);

  const tailPolygonStr = tailPoints.length > 0
    ? `${scaleX(threshold).toFixed(1)},${scaleY(0)} ${tailPoints.join(' ')} ${scaleX(maxX).toFixed(1)},${scaleY(0)}`
    : '';

  const xThreshold = scaleX(threshold);
  const xMeasured = scaleX(mismatches);
  const xMean = scaleX(mean0);

  return (
    <div className="w-full rounded border border-slate-800 bg-[#0B0E17] p-4 text-slate-200">
      <div className="mb-2 flex flex-wrap items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">EXACT BINOMIAL HYPOTHESIS DENSITY (H0: HONEST CHANNEL)</span>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-cyan-400">Mean: {mean0.toFixed(1)}</span>
          <span className="text-amber-400">Threshold: {threshold} ({(thresholdRate * 100).toFixed(2)}%)</span>
          <span className={mismatches >= threshold ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            Measured: {mismatches} ({(qber * 100).toFixed(2)}%)
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        {/* Shaded Rejection Tail (p <= alpha) */}
        {tailPolygonStr && (
          <polygon points={tailPolygonStr} fill="#E11D48" fillOpacity="0.25" />
        )}

        {/* H0 Curve */}
        <polyline
          fill="none"
          stroke="#06B6D4"
          strokeWidth="2"
          points={polylineStr}
        />

        {/* Mean Indicator */}
        <line x1={xMean} y1={padTop} x2={xMean} y2={padTop + plotHeight} stroke="#06B6D4" strokeWidth="1" strokeDasharray="3 3" />

        {/* Threshold Line */}
        <line x1={xThreshold} y1={padTop} x2={xThreshold} y2={padTop + plotHeight} stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 2" />
        <text x={xThreshold + 4} y={padTop + 14} fill="#F59E0B" fontSize="10" fontFamily="monospace" fontWeight="bold">
          THRESHOLD (t={threshold})
        </text>

        {/* Measured point marker */}
        <line x1={xMeasured} y1={padTop} x2={xMeasured} y2={padTop + plotHeight} stroke={mismatches >= threshold ? '#E11D48' : '#10B981'} strokeWidth="2.5" />
        <circle cx={xMeasured} cy={padTop + plotHeight / 2} r="5" fill={mismatches >= threshold ? '#E11D48' : '#10B981'} stroke="#FFFFFF" strokeWidth="1.5" />
        <text
          x={xMeasured + (mismatches >= threshold ? 6 : -6)}
          y={padTop + plotHeight / 2 - 8}
          fill={mismatches >= threshold ? '#E11D48' : '#10B981'}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor={mismatches >= threshold ? 'start' : 'end'}
        >
          MEASURED (k={mismatches})
        </text>

        {/* X Axis ticks */}
        <line x1={padLeft} y1={padTop + plotHeight} x2={padLeft + plotWidth} y2={padTop + plotHeight} stroke="#334155" strokeWidth="1" />
        <text x={scaleX(minX)} y={padTop + plotHeight + 14} fill="#64748B" fontSize="9" fontFamily="monospace">
          {minX}
        </text>
        <text x={xMean} y={padTop + plotHeight + 14} fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">
          {Math.round(mean0)}
        </text>
        <text x={scaleX(maxX)} y={padTop + plotHeight + 14} fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="end">
          {maxX}
        </text>

        <text x={padLeft + plotWidth / 2} y={height - 4} fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="middle">
          MISMATCH COUNT (k)
        </text>
      </svg>
    </div>
  );
};
