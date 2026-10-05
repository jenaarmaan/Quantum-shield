import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveTab =
  | 'home'
  | 'signature'
  | 'attack'
  | 'detection'
  | 'runner'
  | 'boundary'
  | 'advisor'
  | 'benchmark'
  | 'audit'
  | 'reports'
  | 'docs';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickRun: () => void;
  onOpenDemo: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onQuickRun,
  onOpenDemo
}) => {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-800 bg-[#07090E]/95 px-4 backdrop-blur md:px-8">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTabChange('home')}
          className="text-base font-bold tracking-tight text-white hover:text-cyan-400 transition-colors"
        >
          QuantumShield
        </button>
      </div>

      {/* Zone 2: Primary Navigation Links */}
      <nav className="hidden xl:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onTabChange('signature')}
          className={`transition-colors hover:text-white ${
            activeTab === 'signature' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Signature Lab
        </button>
        <button
          onClick={() => onTabChange('attack')}
          className={`transition-colors hover:text-white ${
            activeTab === 'attack' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Attack Lab
        </button>
        <button
          onClick={() => onTabChange('detection')}
          className={`transition-colors hover:text-white ${
            activeTab === 'detection' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Detection
        </button>
        <button
          onClick={() => onTabChange('runner')}
          className={`transition-colors hover:text-white ${
            activeTab === 'runner' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Experiments
        </button>
        <button
          onClick={() => onTabChange('boundary')}
          className={`transition-colors hover:text-white ${
            activeTab === 'boundary' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Boundary
        </button>
        <button
          onClick={() => onTabChange('advisor')}
          className={`transition-colors hover:text-white ${
            activeTab === 'advisor' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Advisor
        </button>
        <button
          onClick={() => onTabChange('benchmark')}
          className={`transition-colors hover:text-white ${
            activeTab === 'benchmark' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          QDS-Bench
        </button>
        <button
          onClick={() => onTabChange('audit')}
          className={`transition-colors hover:text-white ${
            activeTab === 'audit' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Audit
        </button>
        <button
          onClick={() => onTabChange('reports')}
          className={`transition-colors hover:text-white ${
            activeTab === 'reports' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => onTabChange('docs')}
          className={`transition-colors hover:text-white ${
            activeTab === 'docs' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Docs
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenDemo}
          className="hidden sm:inline-flex items-center rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          Demo Dataset
        </button>
        <PWAInstallButton />
        <button
          onClick={onQuickRun}
          className="rounded bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 active:scale-[0.98] whitespace-nowrap"
        >
          Run Security Test
        </button>
      </div>
    </header>
  );
};
