import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, Sliders, Moon, Radio } from 'lucide-react';
import { Station } from '../types/radio';

interface HardwareControlsProps {
  currentStation: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  volume: number;
  onPlayPause: () => void;
  onPrevStation: () => void;
  onNextStation: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onOpenEq: () => void;
  onOpenSleep: () => void;
  sleepTimerRemaining: number | null;
}

export const HardwareControls: React.FC<HardwareControlsProps> = ({
  currentStation,
  isPlaying,
  isLoading,
  isMuted,
  volume,
  onPlayPause,
  onPrevStation,
  onNextStation,
  onToggleMute,
  onVolumeChange,
  isFavorited,
  onToggleFavorite,
  onOpenEq,
  onOpenSleep,
  sleepTimerRemaining,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Station Quick Info & Favorite Toggle */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <button
            onClick={onToggleFavorite}
            disabled={!currentStation}
            title={isFavorited ? 'Remove from Favorites' : 'Save to Favorites & Organize'}
            className={`cursor-pointer p-2.5 rounded-lg border transition-all ${
              isFavorited
                ? 'bg-rose-500/15 border-rose-500/60 text-rose-400 hover:bg-rose-500/25'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-rose-400 hover:border-neutral-700'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 stroke-rose-500' : ''}`} />
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-200 truncate max-w-[220px]">
              {currentStation?.name || 'No Station Tuned'}
            </span>
            <span className="text-[11px] font-mono text-neutral-500">
              {currentStation?.ensemble ? `${currentStation.ensemble} (${currentStation.block})` : 'Standby'}
            </span>
          </div>
        </div>

        {/* Center: Playback Transport Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevStation}
            title="Tune Previous Station"
            className="cursor-pointer p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayPause}
            disabled={!currentStation || isLoading}
            title={isPlaying ? 'Pause Broadcast' : 'Play Live Broadcast'}
            className={`cursor-pointer w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all shadow-lg ${
              isPlaying
                ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300 shadow-amber-500/20 scale-102'
                : 'bg-neutral-100 text-neutral-950 hover:bg-white'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNextStation}
            title="Tune Next Station"
            className="cursor-pointer p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Master Rotary / Fader Volume & Sound Tools */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg">
            <button
              onClick={onToggleMute}
              className="cursor-pointer text-neutral-400 hover:text-neutral-200 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume level"
              className="w-24 sm:w-32 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <span className="text-[11px] font-mono tabular-nums text-neutral-400 min-w-[32px] text-right">
              {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

          {/* Quick DSP tools */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={onOpenEq}
              title="DSP 5-Band Equalizer"
              className="cursor-pointer p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSleep}
              title="Sleep Timer"
              className={`cursor-pointer p-2 rounded-lg border transition-colors ${
                sleepTimerRemaining
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
