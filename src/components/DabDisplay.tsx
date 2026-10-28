import React, { useEffect, useState } from 'react';
import { Station, DisplayBacklight, DisplayScreenMode } from '../types/radio';
import { AudioSpectrumAnalyzer } from './AudioSpectrumAnalyzer';
import { Signal, Clock, Radio, Activity, Cpu, Wifi } from 'lucide-react';

interface DabDisplayProps {
  currentStation: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  backlight: DisplayBacklight;
  setBacklight: (theme: DisplayBacklight) => void;
  presetIndex?: number;
  dlsText: string;
}

export const DabDisplay: React.FC<DabDisplayProps> = ({
  currentStation,
  isPlaying,
  isLoading,
  backlight,
  setBacklight,
  presetIndex,
  dlsText,
}) => {
  const [screenMode, setScreenMode] = useState<DisplayScreenMode>('dls');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Dynamic Virtual RSSI (Received Signal Strength Indicator) State
  const [rssi, setRssi] = useState<{
    dbm: number;
    percentage: number;
    snr: number;
    ber: string;
    levelBars: number; // 0 to 10
  }>({
    dbm: -58,
    percentage: 84,
    snr: 28.6,
    ber: '0.00%',
    levelBars: 8,
  });

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Virtual RSSI Generator
  // Fluctuates realistically based on active station profile, atmospheric multipath jitter, and playback state
  useEffect(() => {
    // Generate a deterministic base signal level for each unique station
    let baseDbm = -56;
    if (currentStation) {
      let hash = 0;
      for (let i = 0; i < currentStation.id.length; i++) {
        hash = (hash << 5) - hash + currentStation.id.charCodeAt(i);
        hash |= 0;
      }
      // Distribute stations across -46 dBm (strong local mux) to -70 dBm (distant fringe mux)
      baseDbm = -46 - Math.abs(hash % 25);
    }

    let phase = 0;

    const interval = setInterval(() => {
      phase += 0.3;

      if (!isPlaying && !isLoading) {
        // Paused / idle receiver state: drops to RF background noise floor
        const noiseFloor = -98 + Math.sin(phase * 0.5) * 2;
        setRssi({
          dbm: Math.round(noiseFloor),
          percentage: 8,
          snr: 3.8,
          ber: '---',
          levelBars: 1,
        });
        return;
      }

      if (isLoading) {
        // Tuning / AFC synchronizing phase: fluctuating search jitter
        const searchDbm = baseDbm - 16 + Math.sin(phase * 3.5) * 6 + (Math.random() - 0.5) * 4;
        const pct = Math.max(12, Math.min(100, Math.round(((searchDbm + 100) / 60) * 100)));
        setRssi({
          dbm: Math.round(searchDbm),
          percentage: pct,
          snr: Math.round((14 + (pct / 100) * 10) * 10) / 10,
          ber: 'SYNC...',
          levelBars: Math.max(1, Math.round((pct / 100) * 10)),
        });
        return;
      }

      // Active tuned broadcast: realistic RF atmospheric & multipath micro-fluctuations
      const slowWander = Math.sin(phase * 0.6) * 1.8 + Math.cos(phase * 1.2) * 1.2;
      const microJitter = (Math.random() - 0.5) * 1.4;
      const currentDbm = Math.min(-36, Math.max(-88, baseDbm + slowWander + microJitter));

      // Standard RSSI Percentage scale: -100 dBm (0%) to -40 dBm (100%)
      const percentage = Math.max(5, Math.min(100, Math.round(((currentDbm + 100) / 60) * 100)));

      // Correlated Signal-to-Noise Ratio (SNR) in dB
      const snr = Math.round((14 + (percentage / 100) * 16.5 + (Math.random() - 0.5) * 0.4) * 10) / 10;

      // Realistic Viterbi Bit Error Rate (BER)
      const ber = percentage >= 60 ? '0.00%' : percentage >= 40 ? '0.01%' : '0.04%';

      // 10-step level bar count
      const levelBars = Math.max(1, Math.min(10, Math.round((percentage / 100) * 10)));

      setRssi({
        dbm: Math.round(currentDbm),
        percentage,
        snr,
        ber,
        levelBars,
      });
    }, 850);

    return () => clearInterval(interval);
  }, [currentStation, isPlaying, isLoading]);

  // Backlight style mappings
  const themeStyles = {
    amber: {
      bg: 'bg-[#1a1205] border-[#d97706]/40 shadow-[inset_0_2px_12px_rgba(217,119,6,0.18)]',
      textPrimary: 'text-amber-400',
      textMuted: 'text-amber-600/90',
      textFaint: 'text-amber-800/80',
      glow: 'shadow-[0_0_16px_rgba(245,158,11,0.15)]',
      accentBg: 'bg-amber-400/20 text-amber-300',
    },
    cyan: {
      bg: 'bg-[#04151a] border-[#0891b2]/40 shadow-[inset_0_2px_12px_rgba(8,145,178,0.18)]',
      textPrimary: 'text-cyan-300',
      textMuted: 'text-cyan-600/90',
      textFaint: 'text-cyan-900/80',
      glow: 'shadow-[0_0_16px_rgba(6,182,212,0.15)]',
      accentBg: 'bg-cyan-400/20 text-cyan-200',
    },
    phosphor: {
      bg: 'bg-[#051809] border-[#16a34a]/40 shadow-[inset_0_2px_12px_rgba(22,163,74,0.18)]',
      textPrimary: 'text-emerald-400',
      textMuted: 'text-emerald-600/90',
      textFaint: 'text-emerald-900/80',
      glow: 'shadow-[0_0_16px_rgba(34,197,94,0.15)]',
      accentBg: 'bg-emerald-400/20 text-emerald-200',
    },
    monochrome: {
      bg: 'bg-[#121316] border-neutral-700/60 shadow-[inset_0_2px_12px_rgba(255,255,255,0.08)]',
      textPrimary: 'text-neutral-100',
      textMuted: 'text-neutral-400',
      textFaint: 'text-neutral-600',
      glow: 'shadow-[0_0_16px_rgba(255,255,255,0.06)]',
      accentBg: 'bg-neutral-200/20 text-neutral-100',
    },
  }[backlight];

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 p-3 sm:p-4 border border-neutral-800 shadow-2xl relative overflow-hidden">
      {/* Top chassis decorative accents */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80 px-1">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 font-semibold flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span>
            RF Tuner // Band III
          </span>
          <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
            174–240 MHz · DAB/DAB+ Receiver
          </span>
        </div>

        {/* Backlight color theme selector */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-md border border-neutral-800">
          <button
            onClick={() => setBacklight('amber')}
            title="Amber Classic Display"
            className={`cursor-pointer w-4 h-4 rounded-full bg-amber-500 transition-transform ${
              backlight === 'amber' ? 'scale-110 ring-2 ring-amber-300 ring-offset-1 ring-offset-neutral-950' : 'opacity-50 hover:opacity-90'
            }`}
          />
          <button
            onClick={() => setBacklight('cyan')}
            title="Cyan Ice Display"
            className={`cursor-pointer w-4 h-4 rounded-full bg-cyan-400 transition-transform ${
              backlight === 'cyan' ? 'scale-110 ring-2 ring-cyan-300 ring-offset-1 ring-offset-neutral-950' : 'opacity-50 hover:opacity-90'
            }`}
          />
          <button
            onClick={() => setBacklight('phosphor')}
            title="Phosphor Green Display"
            className={`cursor-pointer w-4 h-4 rounded-full bg-emerald-500 transition-transform ${
              backlight === 'phosphor' ? 'scale-110 ring-2 ring-emerald-300 ring-offset-1 ring-offset-neutral-950' : 'opacity-50 hover:opacity-90'
            }`}
          />
          <button
            onClick={() => setBacklight('monochrome')}
            title="Monochrome OLED Display"
            className={`cursor-pointer w-4 h-4 rounded-full bg-neutral-200 transition-transform ${
              backlight === 'monochrome' ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-neutral-950' : 'opacity-50 hover:opacity-90'
            }`}
          />
        </div>
      </div>

      {/* Recessed LCD / OLED Screen Window */}
      <div
        className={`relative rounded-xl border p-4 sm:p-5 font-mono select-none overflow-hidden transition-all duration-300 ${themeStyles.bg} ${themeStyles.glow}`}
      >
        {/* Glass sheen effect */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] rounded-xl" />

        {/* 1. Header Telemetry Row with Dynamic Virtual RSSI Bar */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs sm:text-[13px] border-b border-white/10 pb-2 mb-3">
          {/* Virtual RSSI Bar & Signal Lock */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="flex items-center gap-1.5"
              title={`Virtual RSSI: ${rssi.dbm} dBm (${rssi.percentage}%) · SNR: ${rssi.snr} dB`}
            >
              <Signal className={`w-3.5 h-3.5 ${themeStyles.textPrimary}`} />
              <span className="text-[10px] font-bold tracking-wider">RSSI</span>

              {/* Dynamic 10-Segment RSSI Signal Bar */}
              <div className="flex items-end gap-[2px] h-3.5 px-1 py-0.5 bg-black/40 border border-white/10 rounded">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const active = idx < rssi.levelBars;
                  // Graduated segment height
                  const heightPercent = 25 + (idx / 9) * 75;
                  return (
                    <span
                      key={idx}
                      style={{ height: `${heightPercent}%` }}
                      className={`w-1 rounded-[1px] transition-all duration-300 ${
                        active
                          ? `bg-current ${themeStyles.textPrimary} shadow-[0_0_4px_currentColor]`
                          : 'bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Fluctuating RSSI Value */}
              <span className={`text-[11px] font-mono tabular-nums font-semibold ml-0.5 ${themeStyles.textPrimary}`}>
                {rssi.dbm} dBm
              </span>

              <span className={`text-[10px] font-mono tabular-nums ${themeStyles.textMuted} hidden md:inline`}>
                ({rssi.percentage}%)
              </span>

              {/* Tuner Status Tag */}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-1 ${themeStyles.accentBg}`}>
                {isPlaying ? 'LOCK' : isLoading ? 'SYNC...' : 'STANDBY'}
              </span>
            </div>

            <span className={themeStyles.textFaint}>·</span>

            {/* Block & Frequency */}
            <span className={`text-[11px] font-semibold tracking-wide ${themeStyles.textPrimary}`}>
              {currentStation?.block || '12B'} / {currentStation?.frequency || '225.648 MHz'}
            </span>
          </div>

          {/* Audio Bitrate & Preset Status */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
            {presetIndex && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${themeStyles.accentBg}`}>
                PRESET {String(presetIndex).padStart(2, '0')}
              </span>
            )}

            <span className={`font-semibold ${themeStyles.textPrimary}`}>
              {currentStation?.bitrate || 128} kbps {currentStation?.codec || 'AAC+'}
            </span>

            <span className="hidden sm:inline font-bold tracking-wider px-1 py-0.2 bg-white/5 rounded text-[10px] text-white/80">
              STEREO
            </span>
          </div>
        </div>

        {/* 2. Main Content Area */}
        {screenMode === 'dls' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center my-1 min-h-[96px]">
            {/* Station Name & Primary Details */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] tracking-wider uppercase font-semibold ${themeStyles.textMuted}`}>
                  {currentStation?.ensemble || 'BBC National DAB'}
                </span>
                <span className={themeStyles.textFaint}>·</span>
                <span className={`text-[11px] font-medium ${themeStyles.textMuted}`}>
                  {currentStation?.countryName || 'United Kingdom'}
                </span>
              </div>

              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${themeStyles.textPrimary}`}>
                {currentStation?.name || 'Select a DAB+ Station'}
              </h1>

              <p className={`text-xs mt-1 truncate ${themeStyles.textMuted}`}>
                {currentStation?.genre || 'Digital Audio Broadcasting Service'}
              </p>
            </div>

            {/* Real-time Web Audio API Visualizer Component (Compact) */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <AudioSpectrumAnalyzer
                isPlaying={isPlaying}
                backlight={backlight}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Full Expanded SPECTRUM Mode */}
        {screenMode === 'spectrum' && (
          <div className="my-1 py-1 min-h-[96px] space-y-2">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${themeStyles.textPrimary}`}>
                  {currentStation?.name || 'Tuner Audio Analysis'}
                </span>
                <span className={themeStyles.textFaint}>·</span>
                <span className={themeStyles.textMuted}>Web Audio API Real-Time FFT Analyser</span>
              </div>
              <span className={`text-[10px] ${themeStyles.textMuted}`}>
                FFT: 128 · 48.0 kHz Sample Clock
              </span>
            </div>

            <AudioSpectrumAnalyzer
              isPlaying={isPlaying}
              backlight={backlight}
              compact={false}
            />
          </div>
        )}

        {/* Technical RF Telemetry Mode with Expanded Virtual RSSI Monitor */}
        {screenMode === 'technical' && (
          <div className="my-1 py-2 min-h-[96px] space-y-3">
            {/* Prominent High-Resolution Virtual RSSI Bar & Telemetry */}
            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className={`w-4 h-4 ${themeStyles.textPrimary}`} />
                  <span className="font-bold uppercase tracking-wider text-[11px]">
                    Virtual RSSI Receiver Front-End
                  </span>
                  <span className={themeStyles.textFaint}>·</span>
                  <span className={themeStyles.textMuted}>Band III VHF Direct Demodulation</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className={`font-bold ${themeStyles.textPrimary}`}>{rssi.dbm} dBm</span>
                  <span className={themeStyles.textMuted}>({rssi.percentage}% Signal Quality)</span>
                </div>
              </div>

              {/* 20-Segment Calibrated RF RSSI Meter Bar */}
              <div className="flex items-center gap-1 h-4 bg-black/60 p-1 rounded-lg border border-white/5 mb-1.5">
                {Array.from({ length: 20 }).map((_, idx) => {
                  const active = idx < Math.round((rssi.percentage / 100) * 20);
                  const isRedZone = idx >= 17;
                  return (
                    <span
                      key={idx}
                      className={`h-full flex-1 rounded-[1px] transition-all duration-200 ${
                        active
                          ? isRedZone
                            ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                            : `bg-current ${themeStyles.textPrimary} shadow-[0_0_4px_currentColor]`
                          : 'bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Calibration Markers */}
              <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 px-1">
                <span>-100 dBm (Floor)</span>
                <span>-80 dBm (Threshold)</span>
                <span>-60 dBm (Nominal)</span>
                <span>-40 dBm (Max)</span>
              </div>
            </div>

            {/* Sub-telemetry grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-black/40 border border-white/5 rounded-lg p-2.5">
                <span className={`text-[10px] block uppercase ${themeStyles.textMuted}`}>Ensemble Service ID</span>
                <span className={`text-sm font-bold block mt-1 ${themeStyles.textPrimary}`}>
                  0xCE15
                </span>
                <span className={`text-[10px] block mt-0.5 ${themeStyles.textFaint}`}>DAB Standard Mode 1</span>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-lg p-2.5">
                <span className={`text-[10px] block uppercase ${themeStyles.textMuted}`}>Carrier Frequency</span>
                <span className={`text-sm font-bold block mt-1 ${themeStyles.textPrimary}`}>
                  {currentStation?.frequency || '225.648 MHz'}
                </span>
                <span className={`text-[10px] block mt-0.5 ${themeStyles.textFaint}`}>VHF Block {currentStation?.block || '12B'}</span>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-lg p-2.5">
                <span className={`text-[10px] block uppercase ${themeStyles.textMuted}`}>Signal-to-Noise (SNR)</span>
                <span className={`text-sm font-bold block mt-1 ${themeStyles.textPrimary}`}>
                  {rssi.snr} dB
                </span>
                <span className={`text-[10px] block mt-0.5 ${themeStyles.textFaint}`}>C/N Margin: +14.8 dB</span>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-lg p-2.5">
                <span className={`text-[10px] block uppercase ${themeStyles.textMuted}`}>Viterbi Error Rate</span>
                <span className={`text-sm font-bold block mt-1 ${themeStyles.textPrimary}`}>
                  BER: {rssi.ber}
                </span>
                <span className={`text-[10px] block mt-0.5 ${themeStyles.textFaint}`}>Reed-Solomon: 0 Errors</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Dynamic Label Segment (DLS) Marquee & Telemetry Footer */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {/* Scrolling DLS Dynamic Text */}
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className={`text-[10px] font-bold px-1 py-0.5 rounded uppercase shrink-0 ${themeStyles.accentBg}`}>
              DLS
            </span>
            <div className="overflow-hidden whitespace-nowrap flex-1 relative">
              <div
                className={`inline-block font-mono text-[11.5px] tracking-wide ${themeStyles.textPrimary}`}
                style={{
                  animation: isPlaying ? 'marquee 22s linear infinite' : 'none',
                }}
              >
                {dlsText || `${currentStation?.name || 'Aether DAB+'} — High fidelity stereo digital audio stream broadcast.`}
              </div>
            </div>
          </div>

          {/* Clock & Real-Time Dynamic RSSI / SNR Telemetry */}
          <div className={`flex items-center gap-2.5 shrink-0 text-[11px] ${themeStyles.textMuted}`}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="tabular-nums font-semibold">{currentTime}</span>
            </span>
            <span className={themeStyles.textFaint}>|</span>
            <span className="tabular-nums">RSSI: {rssi.dbm} dBm</span>
            <span className={themeStyles.textFaint}>|</span>
            <span className="tabular-nums">SNR: {rssi.snr} dB</span>
          </div>
        </div>
      </div>

      {/* Screen Mode Buttons below display */}
      <div className="flex items-center justify-between mt-2.5 px-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setScreenMode('dls')}
            className={`cursor-pointer px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              screenMode === 'dls'
                ? 'bg-neutral-800 text-amber-400 font-bold border border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-300 bg-neutral-950/60'
            }`}
          >
            DLS INFO
          </button>
          <button
            onClick={() => setScreenMode('spectrum')}
            className={`cursor-pointer px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              screenMode === 'spectrum'
                ? 'bg-neutral-800 text-amber-400 font-bold border border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-300 bg-neutral-950/60'
            }`}
          >
            SPECTRUM ANALYZER
          </button>
          <button
            onClick={() => setScreenMode('technical')}
            className={`cursor-pointer px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              screenMode === 'technical'
                ? 'bg-neutral-800 text-amber-400 font-bold border border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-300 bg-neutral-950/60'
            }`}
          >
            RF TELEMETRY
          </button>
        </div>

        <div className="text-[11px] font-mono text-neutral-500 hidden sm:flex items-center gap-2">
          <span className="tabular-nums">RSSI: {rssi.dbm} dBm</span>
          <span>·</span>
          <span>BER: {rssi.ber}</span>
          <span>·</span>
          <span>SR: 48.0 kHz</span>
        </div>
      </div>
    </div>
  );
};
