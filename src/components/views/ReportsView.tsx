import React from 'react';
import { StoredExperiment } from '../../lib/storage/experimentStore';
import { ReportGenerator } from '../../lib/reports/reportGenerator';

interface ReportsViewProps {
  currentExperiment?: StoredExperiment;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentExperiment }) => {
  if (!currentExperiment) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-slate-800 bg-[#0B0E17] text-xs font-mono text-slate-500">
        NO EXPERIMENT SELECTED FOR REPORT GENERATION.
      </div>
    );
  }

  const reportData = {
    experimentId: currentExperiment.experimentId,
    timestamp: currentExperiment.timestamp,
    config: currentExperiment.config,
    results: currentExperiment.results,
    auditHash: currentExperiment.auditRecord.currentHash,
    previousAuditHash: currentExperiment.auditRecord.previousHash,
    softwareVersion: currentExperiment.auditRecord.softwareVersion,
    detectorVersion: currentExperiment.auditRecord.detectorVersion,
    status: currentExperiment.status
  };

  const handleDownloadJSON = () => {
    const jsonStr = ReportGenerator.toJSON(reportData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantumshield_report_${currentExperiment.experimentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvStr = ReportGenerator.toCSV(reportData);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantumshield_report_${currentExperiment.experimentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHTML = () => {
    const htmlStr = ReportGenerator.toHTML(reportData);
    const blob = new Blob([htmlStr], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantumshield_report_${currentExperiment.experimentId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-5 text-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400">REPORT EXPORT LABORATORY</div>
            <h1 className="text-xl font-bold text-white mt-1">Audit-Ready Security Evaluation Reports</h1>
            <p className="text-xs text-slate-400 mt-1">
              Generate standardized research and compliance exports in JSON, CSV, and self-contained HTML formats.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white hover:bg-slate-700"
            >
              Export JSON
            </button>
            <button
              onClick={handleDownloadCSV}
              className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white hover:bg-slate-700"
            >
              Export CSV
            </button>
            <button
              onClick={handleDownloadHTML}
              className="rounded border border-cyan-800 bg-cyan-950/40 px-3 py-2 text-xs font-mono text-cyan-300 hover:bg-cyan-900/60"
            >
              Export HTML
            </button>
            <button
              onClick={handlePrint}
              className="rounded bg-cyan-500 px-3 py-2 text-xs font-mono font-bold text-slate-950 hover:bg-cyan-400"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview Document */}
      <div className="rounded border border-slate-800 bg-[#0B0E17] p-6 text-slate-200 font-mono text-xs space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-bold text-white tracking-tight">QUANTUMSHIELD EVALUATION MANIFEST</div>
            <div className="text-slate-400 text-xs mt-0.5">Experiment: {currentExperiment.experimentId}</div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div>Timestamp: {currentExperiment.timestamp}</div>
            <div>Status: <strong className="text-emerald-400">{currentExperiment.status}</strong></div>
          </div>
        </div>

        {/* Section 1 */}
        <div className="space-y-2">
          <div className="text-cyan-400 font-bold uppercase text-[11px]">1. VERDICT & THREAT CLASSIFICATION</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-slate-500 text-[10px]">VERDICT</div>
              <div className={`text-xl font-bold mt-1 ${currentExperiment.results.verdict === 'ACCEPT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentExperiment.results.verdict}
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-slate-500 text-[10px]">CLASSIFICATION</div>
              <div className="text-sm font-bold text-white mt-1">
                {currentExperiment.results.threatType}
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-slate-500 text-[10px]">OBSERVED QBER</div>
              <div className="text-sm font-bold text-white mt-1">
                {(currentExperiment.results.qber * 100).toFixed(2)}%
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-slate-500 text-[10px]">THRESHOLD RATE</div>
              <div className="text-sm font-bold text-amber-400 mt-1">
                {(currentExperiment.results.thresholdRate * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <div className="text-cyan-400 font-bold uppercase text-[11px]">2. PLAIN-LANGUAGE EXPLANATION FACTS</div>
          <div className="rounded border border-slate-800 bg-slate-900/40 p-4 text-slate-300 leading-relaxed text-xs">
            {currentExperiment.results.explanation}
          </div>
        </div>

        {/* Section 3 */}
        <div className="space-y-2">
          <div className="text-cyan-400 font-bold uppercase text-[11px]">3. CRYPTOGRAPHIC PROVENANCE & AUDIT TRAIL</div>
          <div className="rounded border border-slate-800 bg-slate-900/40 p-4 space-y-1.5 text-[11px] text-slate-400">
            <div>Audit Hash: <span className="text-white select-all">{currentExperiment.auditRecord.currentHash}</span></div>
            <div>Previous Block: <span className="text-slate-500">{currentExperiment.auditRecord.previousHash}</span></div>
            <div>Random Seed: #{currentExperiment.config.seed}</div>
            <div>Software Engine: QuantumShield v{currentExperiment.auditRecord.softwareVersion} | Detector: v{currentExperiment.auditRecord.detectorVersion}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
