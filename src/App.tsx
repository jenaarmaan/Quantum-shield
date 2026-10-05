import React, { useState } from 'react';
import { TopNav, ActiveTab } from './components/TopNav';
import { TelemetryRibbon } from './components/TelemetryRibbon';
import { HomeView } from './components/views/HomeView';
import { SignatureLabView } from './components/views/SignatureLabView';
import { AttackLabView } from './components/views/AttackLabView';
import { DetectionView } from './components/views/DetectionView';
import { ExperimentRunnerView } from './components/views/ExperimentRunnerView';
import { SecurityBoundaryView } from './components/views/SecurityBoundaryView';
import { ParameterAdvisorView } from './components/views/ParameterAdvisorView';
import { BenchmarkView } from './components/views/BenchmarkView';
import { AuditView } from './components/views/AuditView';
import { ReportsView } from './components/views/ReportsView';
import { DocumentationView } from './components/views/DocumentationView';
import { DemoModeModal } from './components/views/DemoModeModal';
import { globalExperimentService, StoredExperiment } from './lib/storage/experimentStore';
import { ReportGenerator } from './lib/reports/reportGenerator';
import { useOnlineStatus } from './lib/pwa/usePWAInstall';
import { AttackType } from './lib/attacks/attacks';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [experiments, setExperiments] = useState<StoredExperiment[]>(
    globalExperimentService.getExperiments()
  );
  const [currentExp, setCurrentExp] = useState<StoredExperiment | undefined>(
    experiments[0]
  );
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const isOnline = useOnlineStatus();

  const refreshExperiments = () => {
    const list = globalExperimentService.getExperiments();
    setExperiments(list);
    if (!currentExp && list.length > 0) {
      setCurrentExp(list[0]);
    }
  };

  const handleQuickRun = () => {
    const exp = globalExperimentService.runSimulation({
      message: 'Quick Security Vector Verification Target #3910',
      nQubits: 1000,
      noiseRate: 0.02,
      attackType: 'intercept_resend',
      attackStrength: 0.20,
      seed: Math.floor(Math.random() * 90000) + 1000
    });
    refreshExperiments();
    setCurrentExp(exp);
    setActiveTab('detection');
  };

  const handleSignMessage = (params: {
    message: string;
    nQubits: number;
    noiseModel: 'depolarizing' | 'bit_flip' | 'phase_flip' | 'none';
    noiseRate: number;
    seed: number;
  }) => {
    const exp = globalExperimentService.runSimulation({
      message: params.message,
      nQubits: params.nQubits,
      noiseModel: params.noiseModel,
      noiseRate: params.noiseRate,
      attackType: 'none',
      seed: params.seed
    });
    refreshExperiments();
    setCurrentExp(exp);
    setActiveTab('detection');
  };

  const handleExecuteAttack = (params: {
    attackType: AttackType;
    attackStrength: number;
  }) => {
    const exp = globalExperimentService.runSimulation({
      message: currentExp?.config.message ?? 'Target Security Document Payload',
      nQubits: currentExp?.config.nQubits ?? 1000,
      noiseModel: currentExp?.config.noiseModel ?? 'depolarizing',
      noiseRate: currentExp?.config.noiseRate ?? 0.02,
      attackType: params.attackType,
      attackStrength: params.attackStrength,
      seed: Math.floor(Math.random() * 90000) + 1000
    });
    refreshExperiments();
    setCurrentExp(exp);
    setActiveTab('detection');
  };

  const handleReproduce = (id: string) => {
    const orig = globalExperimentService.getExperimentById(id);
    if (!orig) return;

    const rep = globalExperimentService.runSimulation({
      ...orig.config,
      experimentId: `reproduced_${orig.experimentId}`
    });
    refreshExperiments();
    setCurrentExp(rep);
    setActiveTab('detection');
  };

  const handleExportJSON = () => {
    if (!currentExp) return;
    const jsonStr = ReportGenerator.toJSON({
      experimentId: currentExp.experimentId,
      timestamp: currentExp.timestamp,
      config: currentExp.config,
      results: currentExp.results,
      auditHash: currentExp.auditRecord.currentHash,
      previousAuditHash: currentExp.auditRecord.previousHash,
      softwareVersion: currentExp.auditRecord.softwareVersion,
      detectorVersion: currentExp.auditRecord.detectorVersion,
      status: currentExp.status
    });
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantumshield_${currentExp.experimentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!currentExp) return;
    const csvStr = ReportGenerator.toCSV({
      experimentId: currentExp.experimentId,
      timestamp: currentExp.timestamp,
      config: currentExp.config,
      results: currentExp.results,
      auditHash: currentExp.auditRecord.currentHash,
      previousAuditHash: currentExp.auditRecord.previousHash,
      softwareVersion: currentExp.auditRecord.softwareVersion,
      detectorVersion: currentExp.auditRecord.detectorVersion,
      status: currentExp.status
    });
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantumshield_${currentExp.experimentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    if (!currentExp) return;
    const htmlStr = ReportGenerator.toHTML({
      experimentId: currentExp.experimentId,
      timestamp: currentExp.timestamp,
      config: currentExp.config,
      results: currentExp.results,
      auditHash: currentExp.auditRecord.currentHash,
      previousAuditHash: currentExp.auditRecord.previousHash,
      softwareVersion: currentExp.auditRecord.softwareVersion,
      detectorVersion: currentExp.auditRecord.detectorVersion,
      status: currentExp.status
    });
    const blob = new Blob([htmlStr], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantumshield_${currentExp.experimentId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Offline Mode Indicator */}
      {!isOnline && (
        <div className="bg-amber-600 px-4 py-1 text-center text-xs font-mono font-bold text-slate-950">
          OFFLINE CACHED MODE: Local quantum simulation engine active without network latency.
        </div>
      )}

      {/* Top Bar Contract (3 Zones) */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickRun={handleQuickRun}
        onOpenDemo={() => setIsDemoOpen(true)}
      />

      {/* Science Telemetry Ribbon */}
      <TelemetryRibbon
        statusText="NOMINAL (CALIBRATED)"
        protocolName={currentExp?.config.protocol ?? 'Teleportation-QDS'}
        protocolVersion={currentExp?.config.protocolVersion ?? 'QDS-v1.0'}
        seed={currentExp?.config.seed ?? 1337}
        qubitCount={currentExp?.config.nQubits ?? 1000}
        activeVerdict={currentExp?.results.verdict}
      />

      {/* Mobile Tab Selector (Visible on small viewports) */}
      <div className="xl:hidden border-b border-slate-800 bg-[#0B0E17] px-4 py-2 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2 text-xs font-mono">
          {[
            { id: 'home', label: 'Home' },
            { id: 'signature', label: 'Signature Lab' },
            { id: 'attack', label: 'Attack Lab' },
            { id: 'detection', label: 'Detection' },
            { id: 'runner', label: 'Experiments' },
            { id: 'boundary', label: 'Boundary' },
            { id: 'advisor', label: 'Advisor' },
            { id: 'benchmark', label: 'QDS-Bench' },
            { id: 'audit', label: 'Audit' },
            { id: 'reports', label: 'Reports' },
            { id: 'docs', label: 'Docs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`rounded px-2.5 py-1 transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8">
        {activeTab === 'home' && (
          <HomeView
            latestExperiment={currentExp}
            onNavigate={setActiveTab}
            onRunTest={handleQuickRun}
            totalExperiments={experiments.length}
          />
        )}

        {activeTab === 'signature' && (
          <SignatureLabView onSignMessage={handleSignMessage} />
        )}

        {activeTab === 'attack' && (
          <AttackLabView onExecuteAttack={handleExecuteAttack} />
        )}

        {activeTab === 'detection' && (
          <DetectionView
            experiment={currentExp}
            onReproduce={handleReproduce}
            onExportJSON={handleExportJSON}
            onExportCSV={handleExportCSV}
            onExportHTML={handleExportHTML}
          />
        )}

        {activeTab === 'runner' && (
          <ExperimentRunnerView
            experiments={experiments}
            onSelectExperiment={(exp) => {
              setCurrentExp(exp);
              setActiveTab('detection');
            }}
            onReproduce={handleReproduce}
          />
        )}

        {activeTab === 'boundary' && (
          <SecurityBoundaryView />
        )}

        {activeTab === 'advisor' && (
          <ParameterAdvisorView />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkView />
        )}

        {activeTab === 'audit' && (
          <AuditView auditChain={globalExperimentService.getAuditChain()} />
        )}

        {activeTab === 'reports' && (
          <ReportsView currentExperiment={currentExp} />
        )}

        {activeTab === 'docs' && (
          <DocumentationView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#07090E] px-4 py-5 text-center text-xs font-mono text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
          <div>QuantumShield · Deterministic Quantum Security Evaluation Platform · v1.0.0</div>
          <div className="text-[11px] text-slate-600">
            Engine: Python 3.10 Reference + WebAssembly/TS Parity · Audit-Linked
          </div>
        </div>
      </footer>

      {/* Interactive Demo Mode Modal */}
      <DemoModeModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onSelectExperiment={(exp) => {
          refreshExperiments();
          setCurrentExp(exp);
          setActiveTab('detection');
        }}
      />
    </div>
  );
}
