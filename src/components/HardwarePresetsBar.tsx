import React from 'react';
import { Station, FavoriteItem } from '../types/radio';

interface HardwarePresetsBarProps {
  favorites: FavoriteItem[];
  currentStation: Station | null;
  onSelectStation: (station: Station) => void;
  onAssignPreset: (slot: number) => void;
}

export const HardwarePresetsBar: React.FC<HardwarePresetsBarProps> = ({
  favorites,
  currentStation,
  onSelectStation,
  onAssignPreset,
}) => {
  const presetSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getStationForSlot = (slot: number): FavoriteItem | undefined => {
    return favorites.find((f) => f.presetIndex === slot);
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Direct Hardware Presets (1–10)
        </span>
        <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
          Click slot to tune · Long press or + to assign current
        </span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {presetSlots.map((slot) => {
          const item = getStationForSlot(slot);
          const isPlayingThisPreset = item && currentStation && item.stationId === currentStation.id;

          return (
            <div key={slot} className="relative group">
              <button
                onClick={() => {
                  if (item) {
                    onSelectStation(item.station);
                  } else {
                    onAssignPreset(slot);
                  }
                }}
                title={item ? `Preset ${slot}: ${item.station.name} (${item.station.ensemble})` : `Preset ${slot}: Empty (Click to assign)`}
                className={`cursor-pointer w-full flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center relative ${
                  isPlayingThisPreset
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : item
                    ? 'bg-neutral-950 hover:bg-neutral-800/80 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                    : 'bg-neutral-950/40 hover:bg-neutral-900/60 border-neutral-800/60 border-dashed text-neutral-500 hover:text-neutral-400'
                }`}
              >
                {/* Status LED */}
                <div className="flex items-center justify-center mb-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPlayingThisPreset
                        ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                        : item
                        ? 'bg-neutral-600'
                        : 'bg-neutral-800'
                    }`}
                  />
                </div>

                {/* Key Index */}
                <span className="text-xs font-mono font-bold">{slot}</span>

                {/* Truncated station name */}
                <span className="text-[10px] truncate max-w-full font-medium mt-0.5 px-0.5 leading-tight">
                  {item ? item.station.name.replace(/^(BBC Radio|Radio)\s*/i, '') : '+ Empty'}
                </span>
              </button>

              {/* Quick assign action button on hover */}
              {currentStation && (!item || item.stationId !== currentStation.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignPreset(slot);
                  }}
                  title={`Assign "${currentStation.name}" to Preset ${slot}`}
                  className="cursor-pointer absolute -top-1.5 -right-1.5 hidden group-hover:flex w-4 h-4 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-bold items-center justify-center shadow-md hover:bg-amber-400 z-10"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
