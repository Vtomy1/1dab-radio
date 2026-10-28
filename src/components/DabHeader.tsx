import React from 'react';
import { Radio, Plus, Sliders, Moon, Download, Upload } from 'lucide-react';

interface DabHeaderProps {
  activeTab: 'favorites' | 'directory' | 'multiplex';
  setActiveTab: (tab: 'favorites' | 'directory' | 'multiplex') => void;
  onOpenAddModal: () => void;
  onOpenEqModal: () => void;
  onOpenSleepModal: () => void;
  onExport: () => void;
  onImportClick: () => void;
  favoritesCount: number;
  sleepTimerRemaining: number | null;
}

export const DabHeader: React.FC<DabHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenEqModal,
  onOpenSleepModal,
  onExport,
  onImportClick,
  favoritesCount,
  sleepTimerRemaining,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700/60 flex items-center justify-center text-amber-500 shadow-inner">
          <Radio className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-neutral-100 font-sans whitespace-nowrap">
            AETHER <span className="text-amber-500 font-mono text-xs tracking-wider uppercase ml-1">DAB+</span>
          </span>
          <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase -mt-0.5">
            Digital Audio Ensemble
          </span>
        </div>
      </div>

      {/* Zone 2: 3-4 clean single-line navigation links/tabs */}
      <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'favorites'
              ? 'text-amber-400 border-amber-500 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 border-transparent'
          }`}
        >
          My Stations ({favoritesCount})
        </button>

        <button
          onClick={() => setActiveTab('multiplex')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'multiplex'
              ? 'text-amber-400 border-amber-500 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 border-transparent'
          }`}
        >
          Ensembles & Multiplexes
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'directory'
              ? 'text-amber-400 border-amber-500 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 border-transparent'
          }`}
        >
          Global Station Search
        </button>
      </nav>

      {/* Zone 3: Functional utilities & Primary Action button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenEqModal}
          title="Digital Audio Equalizer"
          className="p-2 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800 transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSleepModal}
          title={sleepTimerRemaining ? `Sleep Timer: ${Math.ceil(sleepTimerRemaining / 60)}m` : 'Sleep Timer'}
          className={`p-2 rounded-md border transition-colors flex items-center gap-1.5 ${
            sleepTimerRemaining
              ? 'text-amber-400 border-amber-500/50 bg-amber-500/10'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border-neutral-800'
          }`}
        >
          <Moon className="w-4 h-4" />
          {sleepTimerRemaining && (
            <span className="text-[11px] font-mono text-amber-400">
              {Math.floor(sleepTimerRemaining / 60)}:{String(sleepTimerRemaining % 60).padStart(2, '0')}
            </span>
          )}
        </button>

        <button
          onClick={onExport}
          title="Export Favorites Backup (JSON)"
          className="hidden md:flex p-2 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onImportClick}
          title="Import Favorites Backup"
          className="hidden md:flex p-2 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800 transition-colors"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenAddModal}
          className="cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Custom Station</span>
        </button>
      </div>
    </header>
  );
};
