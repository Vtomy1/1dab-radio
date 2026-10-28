import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { DisplayBacklight } from '../types/radio';
import { BarChart3, Activity, Gauge, Zap } from 'lucide-react';

export type VisualizerMode = 'bars' | 'vu' | 'oscilloscope' | 'octave';

interface AudioSpectrumAnalyzerProps {
  isPlaying: boolean;
  backlight: DisplayBacklight;
  compact?: boolean;
}

export const AudioSpectrumAnalyzer: React.FC<AudioSpectrumAnalyzerProps> = ({
  isPlaying,
  backlight,
  compact = false,
}) => {
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const [peakHold, setPeakHold] = useState(true);
  const [sensitivity, setSensitivity] = useState<number>(1.2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Peak hold state
  const peaksRef = useRef<{ val: number; speed: number; hold: number }[]>([]);

  // Smooth needle ballistics for VU meter
  const vuLeftRef = useRef<number>(0);
  const vuRightRef = useRef<number>(0);

  // Theme palette helper
  const getColor = (alpha = 1) => {
    switch (backlight) {
      case 'cyan':
        return `rgba(6, 182, 212, ${alpha})`;
      case 'phosphor':
        return `rgba(34, 197, 94, ${alpha})`;
      case 'monochrome':
        return `rgba(248, 250, 252, ${alpha})`;
      case 'amber':
      default:
        return `rgba(245, 158, 11, ${alpha})`;
    }
  };

  const getPeakColor = (alpha = 1) => {
    switch (backlight) {
      case 'cyan':
        return `rgba(103, 232, 249, ${alpha})`;
      case 'phosphor':
        return `rgba(134, 239, 172, ${alpha})`;
      case 'monochrome':
        return `rgba(255, 255, 255, ${alpha})`;
      case 'amber':
      default:
        return `rgba(254, 240, 138, ${alpha})`;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const freqData = new Uint8Array(64);
    const timeData = new Uint8Array(128);

    // Initialize peaks
    if (peaksRef.current.length !== 32) {
      peaksRef.current = Array.from({ length: 32 }, () => ({ val: 0, speed: 0, hold: 0 }));
    }

    const render = () => {
      audioEngine.getFrequencyData(freqData);
      audioEngine.getTimeDomainData(timeData);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // -------------------------------------------------------------
      // MODE 1: DIGITAL SPECTRUM BARS WITH FLOATING PEAKS
      // -------------------------------------------------------------
      if (mode === 'bars') {
        const barCount = compact ? 24 : 32;
        const gap = compact ? 2 : 3;
        const totalGap = gap * (barCount - 1);
        const barWidth = Math.max(2, (w - totalGap) / barCount);

        for (let i = 0; i < barCount; i++) {
          const raw = freqData[i] || 0;
          const boosted = Math.min(255, raw * sensitivity);
          const barHeight = isPlaying ? Math.max(3, (boosted / 255) * (h - 6)) : 2;
          const x = i * (barWidth + gap);
          const y = h - barHeight;

          // Peak physics
          const peak = peaksRef.current[i] || { val: 0, speed: 0, hold: 0 };
          if (barHeight >= peak.val) {
            peak.val = barHeight;
            peak.speed = 0;
            peak.hold = 12; // hold for 12 frames
          } else {
            if (peak.hold > 0) {
              peak.hold -= 1;
            } else {
              peak.speed += 0.35; // gravity acceleration
              peak.val = Math.max(0, peak.val - peak.speed);
            }
          }
          peaksRef.current[i] = peak;

          // Draw segmented LCD bars
          const segmentHeight = compact ? 3 : 4;
          const segmentGap = 1.5;
          const numSegments = Math.max(1, Math.floor(barHeight / (segmentHeight + segmentGap)));

          for (let s = 0; s < numSegments; s++) {
            const segY = h - (s + 1) * (segmentHeight + segmentGap);
            const intensity = 0.4 + (s / (h / (segmentHeight + segmentGap))) * 0.6;
            ctx.fillStyle = getColor(Math.min(1, intensity));
            ctx.fillRect(x, segY, barWidth, segmentHeight);
          }

          // Draw floating peak line
          if (peakHold && peak.val > 2) {
            const peakY = Math.max(1, h - peak.val);
            ctx.fillStyle = getPeakColor(0.95);
            ctx.fillRect(x, peakY, barWidth, 2);
          }
        }
      }

      // -------------------------------------------------------------
      // MODE 2: DUAL ANALOG STEREO VU METERS
      // -------------------------------------------------------------
      else if (mode === 'vu') {
        // Compute Left / Right RMS levels from frequency bins
        let sumL = 0;
        let sumR = 0;
        for (let i = 0; i < 32; i++) sumL += freqData[i];
        for (let i = 32; i < 64; i++) sumR += freqData[i];

        const targetL = isPlaying ? Math.min(1, (sumL / (32 * 255)) * 1.5 * sensitivity) : 0.02;
        const targetR = isPlaying ? Math.min(1, (sumR / (32 * 255)) * 1.5 * sensitivity) : 0.02;

        // Needle ballistics: rapid attack, smooth release
        vuLeftRef.current += (targetL - vuLeftRef.current) * (targetL > vuLeftRef.current ? 0.35 : 0.12);
        vuRightRef.current += (targetR - vuRightRef.current) * (targetR > vuRightRef.current ? 0.35 : 0.12);

        const meterWidth = (w - 16) / 2;
        const meterHeight = h;

        const drawSingleVUMeter = (xOffset: number, value: number, label: string) => {
          // Meter background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.strokeStyle = getColor(0.2);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(xOffset, 2, meterWidth, meterHeight - 4, 6);
          ctx.fill();
          ctx.stroke();

          // Arc scale
          const centerX = xOffset + meterWidth / 2;
          const centerY = meterHeight + (compact ? 12 : 24);
          const radius = meterHeight * (compact ? 1.1 : 1.35);

          const startAngle = Math.PI * 1.25;
          const endAngle = Math.PI * 1.75;

          // Scale arc
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.strokeStyle = getColor(0.3);
          ctx.lineWidth = 2;
          ctx.stroke();

          // Overload / Red zone arc
          const redStart = startAngle + (endAngle - startAngle) * 0.78;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, redStart, endAngle);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Scale ticks
          const ticks = [-20, -10, -7, -5, -3, 0, 1, 2, 3];
          ticks.forEach((t, idx) => {
            const frac = idx / (ticks.length - 1);
            const tickAngle = startAngle + (endAngle - startAngle) * frac;
            const r1 = radius - 3;
            const r2 = radius + (t === 0 ? 5 : 2);
            const x1 = centerX + Math.cos(tickAngle) * r1;
            const y1 = centerY + Math.sin(tickAngle) * r1;
            const x2 = centerX + Math.cos(tickAngle) * r2;
            const y2 = centerY + Math.sin(tickAngle) * r2;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = t >= 0 ? 'rgba(239, 68, 68, 0.8)' : getColor(0.4);
            ctx.lineWidth = t === 0 ? 1.5 : 1;
            ctx.stroke();
          });

          // Needle deflection
          const needleAngle = startAngle + (endAngle - startAngle) * Math.min(1, Math.max(0, value));
          const needleX = centerX + Math.cos(needleAngle) * (radius - 2);
          const needleY = centerY + Math.sin(needleAngle) * (radius - 2);

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(needleX, needleY);
          ctx.strokeStyle = value >= 0.78 ? '#ef4444' : getPeakColor(0.95);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Center pivot
          ctx.beginPath();
          ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
          ctx.fillStyle = getColor(0.9);
          ctx.fill();

          // Label
          ctx.fillStyle = getColor(0.8);
          ctx.font = '9px monospace';
          ctx.fillText(`CH ${label}`, xOffset + 8, meterHeight - 8);

          // Peak LED
          if (value >= 0.78) {
            ctx.beginPath();
            ctx.arc(xOffset + meterWidth - 10, 10, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        };

        drawSingleVUMeter(2, vuLeftRef.current, 'L');
        drawSingleVUMeter(meterWidth + 10, vuRightRef.current, 'R');
      }

      // -------------------------------------------------------------
      // MODE 3: CRT OSCILLOSCOPE TIME-DOMAIN WAVEFORM
      // -------------------------------------------------------------
      else if (mode === 'oscilloscope') {
        // Draw grid lines
        ctx.strokeStyle = getColor(0.08);
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Horizontal center line
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        // Vertical divisions
        for (let x = 0; x < w; x += 30) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        ctx.stroke();

        // Draw waveform trace
        ctx.beginPath();
        const sliceWidth = w / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0; // 1.0 is center
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        // Phosphor glow effect
        ctx.strokeStyle = getColor(0.9);
        ctx.lineWidth = 1.8;
        ctx.shadowColor = getColor(0.6);
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // -------------------------------------------------------------
      // MODE 4: 10-OCTAVE HARDWARE EQUALIZER SPECTRUM
      // -------------------------------------------------------------
      else if (mode === 'octave') {
        const bands = [
          { label: '31', idx: 1 },
          { label: '63', idx: 2 },
          { label: '125', idx: 4 },
          { label: '250', idx: 8 },
          { label: '500', idx: 14 },
          { label: '1k', idx: 22 },
          { label: '2k', idx: 32 },
          { label: '4k', idx: 42 },
          { label: '8k', idx: 52 },
          { label: '16k', idx: 60 },
        ];

        const barWidth = (w - (bands.length - 1) * 6) / bands.length;

        bands.forEach((b, i) => {
          const raw = freqData[b.idx] || 0;
          const boosted = Math.min(255, raw * sensitivity);
          const barHeight = isPlaying ? Math.max(3, (boosted / 255) * (h - 16)) : 2;
          const x = i * (barWidth + 6);
          const y = h - 14 - barHeight;

          // Segmented bars
          const segCount = Math.max(1, Math.floor(barHeight / 4));
          for (let s = 0; s < segCount; s++) {
            const segY = h - 14 - (s + 1) * 4;
            ctx.fillStyle = getColor(0.4 + (s / segCount) * 0.6);
            ctx.fillRect(x, segY, barWidth, 3);
          }

          // Top cap
          ctx.fillStyle = getPeakColor(0.9);
          ctx.fillRect(x, y, barWidth, 1.5);

          // Frequency label at bottom
          ctx.fillStyle = getColor(0.5);
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(b.label, x + barWidth / 2, h - 3);
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, backlight, mode, peakHold, sensitivity, compact]);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Top visualizer mode selector & telemetry tools */}
      <div className="flex items-center justify-between px-1 text-[10px] font-mono">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('bars')}
            title="Digital Spectrum Bars"
            className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
              mode === 'bars'
                ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            BARS
          </button>
          <button
            onClick={() => setMode('vu')}
            title="Stereo Dual VU Meter"
            className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
              mode === 'vu'
                ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            DUAL VU
          </button>
          <button
            onClick={() => setMode('oscilloscope')}
            title="Oscilloscope Waveform"
            className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
              mode === 'oscilloscope'
                ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            WAVE
          </button>
          <button
            onClick={() => setMode('octave')}
            title="10-Octave EQ Analyzer"
            className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
              mode === 'octave'
                ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            OCTAVE
          </button>
        </div>

        {/* Sensitivity & Peak Toggle */}
        <div className="flex items-center gap-2">
          {mode === 'bars' && (
            <button
              onClick={() => setPeakHold(!peakHold)}
              title="Toggle floating peak hold"
              className={`cursor-pointer text-[9px] uppercase px-1 rounded transition-colors ${
                peakHold ? 'text-amber-400' : 'text-neutral-600'
              }`}
            >
              PEAK: {peakHold ? 'ON' : 'OFF'}
            </button>
          )}

          <button
            onClick={() => {
              const nextSens = sensitivity === 1.0 ? 1.5 : sensitivity === 1.5 ? 2.0 : 1.0;
              setSensitivity(nextSens);
            }}
            title="Cycle visual sensitivity boost"
            className="cursor-pointer text-[9px] text-neutral-400 hover:text-neutral-200 px-1 rounded bg-black/40 border border-white/5"
          >
            GAIN: {sensitivity}x
          </button>
        </div>
      </div>

      {/* Canvas Display Viewport */}
      <div
        className={`w-full rounded-lg bg-black/50 border border-white/10 relative overflow-hidden flex items-center justify-center ${
          compact ? 'h-14' : 'h-24'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={compact ? 280 : 520}
          height={compact ? 56 : 96}
          className="w-full h-full block"
        />

        {/* Muted or stopped indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-mono text-neutral-500 tracking-wider uppercase">
              Audio Engine Standby
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
