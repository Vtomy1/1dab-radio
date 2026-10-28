import React from 'react';
import { Station, FavoriteItem } from '../types/radio';
import { X, Radio, Check } from 'lucide-react';

interface PresetAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotNumber: number | null;
  favorites: FavoriteItem[];
  currentStation: Station | null;
  onAssign: (station: Station, slot: number) => void;
}

export const PresetAssignModal: React.FC<PresetAssignModalProps> = ({
  isOpen,
  onClose,
  slotNumber,
  favorites,
  currentStation,
  onAssign,
}) => {
  if (!isOpen || slotNumber === null) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-amber-500 font-mono font-bold">
              P{slotNumber}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Assign Hardware Preset {slotNumber}
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Select a station to map to hardware key {slotNumber}
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

        {/* Quick Assign Currently Playing Station */}
        {currentStation && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                Currently Tuned
              </span>
              <p className="text-xs font-bold text-neutral-100 truncate">
                {currentStation.name}
              </p>
            </div>
            <button
              onClick={() => {
                onAssign(currentStation, slotNumber);
                onClose();
              }}
              className="cursor-pointer px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs rounded-lg transition-colors shrink-0"
            >
              Assign to P{slotNumber}
            </button>
          </div>
        )}

        {/* Choose from existing favorites */}
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
            Or choose from your saved stations:
          </span>
          {favorites.map((fav) => {
            const isAssignedToThisSlot = fav.presetIndex === slotNumber;

            return (
              <button
                key={fav.stationId}
                onClick={() => {
                  onAssign(fav.station, slotNumber);
                  onClose();
                }}
                className={`cursor-pointer w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors ${
                  isAssignedToThisSlot
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-950 border-neutral-800/80 hover:bg-neutral-800 text-neutral-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold truncate">{fav.station.name}</span>
                    {fav.presetIndex && (
                      <span className="text-[10px] font-mono text-neutral-500">
                        (currently P{fav.presetIndex})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 truncate block">
                    {fav.station.ensemble} · {fav.station.genre}
                  </span>
                </div>

                {isAssignedToThisSlot && (
                  <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
