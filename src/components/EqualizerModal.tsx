import React from 'react';
import { EqualizerSettings } from '../types/radio';
import { EQ_PRESETS } from '../services/audioEngine';
import { Sliders, RotateCcw, X } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equalizer: EqualizerSettings;
  onChangeEqualizer: (eq: EqualizerSettings) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  equalizer,
  onChangeEqualizer,
}) => {
  if (!isOpen) return null;

  const handleBandChange = (band: keyof Omit<EqualizerSettings, 'preset'>, val: number) => {
    onChangeEqualizer({
      ...equalizer,
      [band]: val,
      preset: 'custom',
    });
  };

  const handlePresetSelect = (presetKey: string) => {
    if (EQ_PRESETS[presetKey]) {
      onChangeEqualizer(EQ_PRESETS[presetKey]);
    }
  };

  const handleReset = () => {
    onChangeEqualizer(EQ_PRESETS.flat);
  };

  const bands: Array<{ key: keyof Omit<EqualizerSettings, 'preset'>; label: string; freq: string }> = [
    { key: 'band60', label: 'Bass', freq: '60 Hz' },
    { key: 'band250', label: 'Low-Mid', freq: '250 Hz' },
    { key: 'band1k', label: 'Mid', freq: '1.0 kHz' },
    { key: 'band4k', label: 'High-Mid', freq: '4.0 kHz' },
    { key: 'band12k', label: 'Treble', freq: '12.0 kHz' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-amber-500">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100 font-sans">
                Digital Audio DSP Equalizer
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Hardware 5-Band Biquad Parametric DSP
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

        {/* DSP Presets bar */}
        <div className="mb-6">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
            Equalizer Presets
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
            {Object.keys(EQ_PRESETS).map((key) => {
              const isSelected = equalizer.preset === key;
              const names: Record<string, string> = {
                flat: 'Flat',
                speech: 'Speech',
                bass_boost: 'Bass +',
                jazz: 'Jazz',
                classical: 'Classical',
                rock: 'Rock',
              };
              return (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`cursor-pointer py-1.5 px-2 rounded-lg text-center font-medium capitalize transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 border border-neutral-800'
                  }`}
                >
                  {names[key] || key}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Fader Sliders */}
        <div className="grid grid-cols-5 gap-3 bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-4 mb-5">
          {bands.map((band) => {
            const val = equalizer[band.key];
            return (
              <div key={band.key} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
                  {val > 0 ? `+${val}` : val} dB
                </span>

                <div className="h-32 flex items-center justify-center relative py-2">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={val}
                    onChange={(e) => handleBandChange(band.key, parseInt(e.target.value, 10))}
                    className="h-28 -rotate-90 appearance-none cursor-pointer bg-neutral-800 rounded-lg accent-amber-500 w-28"
                  />
                </div>

                <div className="text-center mt-1">
                  <span className="block text-xs font-semibold text-neutral-200">{band.label}</span>
                  <span className="block text-[10px] font-mono text-neutral-500">{band.freq}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
          <button
            onClick={handleReset}
            className="cursor-pointer flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Flat</span>
          </button>

          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg hover:bg-amber-300"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
