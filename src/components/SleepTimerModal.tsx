import React, { useState } from 'react';
import { Moon, Clock, X, Check } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSecondsRemaining: number | null;
  onStartTimer: (minutes: number) => void;
  onClearTimer: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeSecondsRemaining,
  onStartTimer,
  onClearTimer,
}) => {
  const [customMins, setCustomMins] = useState<string>('30');

  if (!isOpen) return null;

  const presets = [15, 30, 45, 60, 90, 120];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-amber-500">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Broadcast Sleep Timer</h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Auto-off with smooth audio fade out
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer p-1 text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeSecondsRemaining !== null && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 mb-5 text-center">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
              Timer In Progress
            </span>
            <span className="text-2xl font-mono font-bold text-amber-300 tabular-nums">
              {Math.floor(activeSecondsRemaining / 60)}:
              {String(activeSecondsRemaining % 60).padStart(2, '0')}
            </span>
            <div className="mt-3">
              <button
                onClick={onClearTimer}
                className="cursor-pointer px-3 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 rounded-md transition-colors"
              >
                Cancel Active Timer
              </button>
            </div>
          </div>
        )}

        {/* Preset choices */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 font-mono uppercase tracking-wider">
              Quick Timer Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    onStartTimer(mins);
                    onClose();
                  }}
                  className="cursor-pointer py-2 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-200 hover:text-amber-400 transition-colors"
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Custom timer input */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Custom Duration (minutes)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="360"
                value={customMins}
                onChange={(e) => setCustomMins(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                onClick={() => {
                  const m = parseInt(customMins, 10);
                  if (m > 0) {
                    onStartTimer(m);
                    onClose();
                  }
                }}
                className="cursor-pointer px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Set Timer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
