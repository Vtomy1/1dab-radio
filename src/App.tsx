/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Station, FavoriteItem } from './types/radio';
import { DEFAULT_STATIONS } from './data/defaultStations';
import { audioEngine } from './services/audioEngine';
import { useRadioStorage } from './hooks/useRadioStorage';
import { DabHeader } from './components/DabHeader';
import { DabDisplay } from './components/DabDisplay';
import { HardwarePresetsBar } from './components/HardwarePresetsBar';
import { HardwareControls } from './components/HardwareControls';
import { FavoritesManager } from './components/FavoritesManager';
import { StationDirectory } from './components/StationDirectory';
import { EqualizerModal } from './components/EqualizerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { StationModal } from './components/StationModal';
import { PresetAssignModal } from './components/PresetAssignModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const {
    favorites,
    folders,
    equalizer,
    setEqualizer,
    backlight,
    setBacklight,
    lastStationId,
    setLastStationId,
    savedVolume,
    setSavedVolume,
    isFavorite,
    toggleFavorite,
    updateFavoriteDetails,
    updateStation,
    assignPreset,
    incrementPlayCount,
    addFolder,
    renameFolder,
    deleteFolder,
    addCustomStation,
    exportData,
    importData,
  } = useRadioStorage();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'favorites' | 'multiplex' | 'directory'>('favorites');

  // Playback state
  const [currentStation, setCurrentStation] = useState<Station | null>(() => {
    const found = DEFAULT_STATIONS.find((s) => s.id === lastStationId);
    return found || DEFAULT_STATIONS[0];
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(savedVolume);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);

  // DLS Dynamic text
  const [dlsText, setDlsText] = useState<string>('');

  // Modals state
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [presetModalSlot, setPresetModalSlot] = useState<number | null>(null);

  // Notification toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3800);
  };

  // Wire HTML5 audio events
  useEffect(() => {
    const audio = audioEngine.getAudioElement();
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };
    const onWaiting = () => {
      setIsLoading(true);
    };
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      showToast('Encountered stream connection issue. Retrying or choose another station.', 'error');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('playing', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('playing', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // Update dynamic label text (DLS) when station changes
  useEffect(() => {
    if (!currentStation) return;

    const phrases = [
      `NOW PLAYING · ${currentStation.name} · Digital Audio Broadcasting Service`,
      `Ensemble: ${currentStation.ensemble} [${currentStation.block} · ${currentStation.frequency || '225.648 MHz'}]`,
      `Quality: ${currentStation.bitrate} kbps ${currentStation.codec} Stereo · 48.0 kHz`,
      `Genre: ${currentStation.genre} · Origin: ${currentStation.countryName}`,
      `AETHER DAB+ · Synchronized Low-Jitter Audio Clock · SNR 28.6 dB`,
    ];

    let phraseIndex = 0;
    setDlsText(phrases[0]);

    const timer = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setDlsText(phrases[phraseIndex]);
    }, 12000);

    return () => clearInterval(timer);
  }, [currentStation]);

  // Handle Station Tuning
  const handlePlayStation = useCallback(
    async (station: Station) => {
      setCurrentStation(station);
      setLastStationId(station.id);
      setIsLoading(true);

      const success = await audioEngine.play(station.streamUrl, station.fallbackUrl);
      setIsLoading(false);
      if (success) {
        setIsPlaying(true);
        incrementPlayCount(station.id);
        // Apply EQ to new stream
        audioEngine.applyEqualizer(equalizer);
        audioEngine.setVolume(isMuted ? 0 : volume);
      } else {
        setIsPlaying(false);
        showToast(`Unable to connect to ${station.name} stream.`, 'error');
      }
    },
    [equalizer, isMuted, volume, incrementPlayCount, setLastStationId]
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else if (currentStation) {
      handlePlayStation(currentStation);
    }
  }, [isPlaying, currentStation, handlePlayStation]);

  // Volume & Mute handling
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setSavedVolume(newVol);
    if (isMuted) setIsMuted(false);
    audioEngine.setVolume(newVol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  // Next / Previous station in current ensemble or favorites
  const handleNextStation = () => {
    const list = DEFAULT_STATIONS;
    if (!currentStation || list.length === 0) return;
    const currentIndex = list.findIndex((s) => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % list.length;
    handlePlayStation(list[nextIndex]);
  };

  const handlePrevStation = () => {
    const list = DEFAULT_STATIONS;
    if (!currentStation || list.length === 0) return;
    const currentIndex = list.findIndex((s) => s.id === currentStation.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    handlePlayStation(list[prevIndex]);
  };

  // Sleep Timer
  const handleStartSleepTimer = (minutes: number) => {
    audioEngine.startSleepTimer(
      minutes,
      (rem) => setSleepTimerSeconds(rem),
      () => {
        setSleepTimerSeconds(null);
        setIsPlaying(false);
        showToast('Sleep timer expired. Broadcast stopped.');
      }
    );
    showToast(`Sleep timer active: ${minutes} minutes`);
  };

  const handleClearSleepTimer = () => {
    audioEngine.clearSleepTimer();
    setSleepTimerSeconds(null);
    showToast('Sleep timer cancelled');
  };

  // Equalizer update
  const handleEqualizerChange = (newEq: typeof equalizer) => {
    setEqualizer(newEq);
    audioEngine.applyEqualizer(newEq);
  };

  // Custom Station Add
  const handleSaveCustomStation = (
    data: Omit<Station, 'id' | 'isCustom'>,
    folderId?: string,
    presetSlot?: number
  ) => {
    const created = addCustomStation(data);
    toggleFavorite(created, folderId);
    if (presetSlot) {
      assignPreset(created, presetSlot);
    }
    showToast(`Added custom station "${created.name}"`);
    handlePlayStation(created);
  };

  const handleUpdateStationDetails = (stationId: string, updates: Partial<Station>) => {
    updateStation(stationId, updates);
    if (currentStation && currentStation.id === stationId) {
      setCurrentStation((prev) => (prev ? { ...prev, ...updates } : null));
    }
    showToast('Station details updated');
  };

  // Backup Import handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importData(content);
        if (res.success) {
          showToast(res.message, 'success');
        } else {
          showToast(res.message, 'error');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Current active preset index if assigned
  const currentPresetItem = favorites.find(
    (f) => currentStation && f.stationId === currentStation.id && f.presetIndex
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Hidden file input for JSON favorites backup restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-950/95 border-rose-800 text-rose-200'
              : 'bg-neutral-900/95 border-amber-500/50 text-neutral-100'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="cursor-pointer ml-2 text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header conforming to Top Bar Contract */}
      <DabHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingStation(null);
          setIsStationModalOpen(true);
        }}
        onOpenEqModal={() => setIsEqModalOpen(true)}
        onOpenSleepModal={() => setIsSleepModalOpen(true)}
        onExport={exportData}
        onImportClick={() => fileInputRef.current?.click()}
        favoritesCount={favorites.length}
        sleepTimerRemaining={sleepTimerSeconds}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hardware Receiver Top Console: Display & Direct Presets 1-10 */}
        <section className="space-y-4">
          <DabDisplay
            currentStation={currentStation}
            isPlaying={isPlaying}
            isLoading={isLoading}
            backlight={backlight}
            setBacklight={setBacklight}
            presetIndex={currentPresetItem?.presetIndex}
            dlsText={dlsText}
          />

          <HardwarePresetsBar
            favorites={favorites}
            currentStation={currentStation}
            onSelectStation={handlePlayStation}
            onAssignPreset={(slot) => setPresetModalSlot(slot)}
          />

          <HardwareControls
            currentStation={currentStation}
            isPlaying={isPlaying}
            isLoading={isLoading}
            isMuted={isMuted}
            volume={volume}
            onPlayPause={handlePlayPause}
            onPrevStation={handlePrevStation}
            onNextStation={handleNextStation}
            onToggleMute={handleToggleMute}
            onVolumeChange={handleVolumeChange}
            isFavorited={currentStation ? isFavorite(currentStation.id) : false}
            onToggleFavorite={() => {
              if (currentStation) {
                const wasFav = isFavorite(currentStation.id);
                toggleFavorite(currentStation);
                showToast(
                  wasFav
                    ? `Removed "${currentStation.name}" from favorites`
                    : `Saved "${currentStation.name}" to favorites`
                );
              }
            }}
            onOpenEq={() => setIsEqModalOpen(true)}
            onOpenSleep={() => setIsSleepModalOpen(true)}
            sleepTimerRemaining={sleepTimerSeconds}
          />
        </section>

        {/* Dynamic Tab Views */}
        <section className="pt-2">
          {activeTab === 'favorites' && (
            <FavoritesManager
              favorites={favorites}
              folders={folders}
              currentStation={currentStation}
              isPlaying={isPlaying}
              onPlayStation={handlePlayStation}
              onToggleFavorite={(station) => {
                toggleFavorite(station);
                showToast(`Updated favorites for "${station.name}"`);
              }}
              onUpdateFavorite={(id, updates) => {
                updateFavoriteDetails(id, updates);
                showToast('Station details updated');
              }}
              onAssignPreset={(station, slot) => {
                assignPreset(station, slot);
                showToast(`Assigned "${station.name}" to Hardware Preset ${slot}`);
              }}
              onAddFolder={(name, color) => {
                addFolder(name, color);
                showToast(`Created folder "${name}"`);
              }}
              onRenameFolder={(id, name, color) => {
                renameFolder(id, name, color);
                showToast(`Folder updated to "${name}"`);
              }}
              onDeleteFolder={(id) => {
                deleteFolder(id);
                showToast('Folder deleted');
              }}
              onEditStation={(station) => {
                setEditingStation(station);
                setIsStationModalOpen(true);
              }}
              onNavigateToDirectory={() => setActiveTab('multiplex')}
            />
          )}

          {activeTab === 'multiplex' && (
            <StationDirectory
              viewMode="multiplex"
              currentStation={currentStation}
              isPlaying={isPlaying}
              folders={folders}
              isFavorite={isFavorite}
              onPlayStation={handlePlayStation}
              onToggleFavorite={(station, folderId) => {
                const wasFav = isFavorite(station.id);
                toggleFavorite(station, folderId);
                showToast(
                  wasFav
                    ? `Removed "${station.name}" from library`
                    : `Added "${station.name}" to your stations library`
                );
              }}
              onOpenAddModal={() => {
                setEditingStation(null);
                setIsStationModalOpen(true);
              }}
            />
          )}

          {activeTab === 'directory' && (
            <StationDirectory
              viewMode="directory"
              currentStation={currentStation}
              isPlaying={isPlaying}
              folders={folders}
              isFavorite={isFavorite}
              onPlayStation={handlePlayStation}
              onToggleFavorite={(station, folderId) => {
                const wasFav = isFavorite(station.id);
                toggleFavorite(station, folderId);
                showToast(
                  wasFav
                    ? `Removed "${station.name}" from library`
                    : `Added "${station.name}" to your stations library`
                );
              }}
              onOpenAddModal={() => {
                setEditingStation(null);
                setIsStationModalOpen(true);
              }}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-neutral-900 bg-neutral-950 px-6 py-6 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>AETHER DAB+ PRECISION DIGITAL TUNER</span>
            <span>·</span>
            <span>BAND III VHF</span>
          </div>
          <div>
            <span>Stereo AAC+ / MP2 High Definition Radio Receiver</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EqualizerModal
        isOpen={isEqModalOpen}
        onClose={() => setIsEqModalOpen(false)}
        equalizer={equalizer}
        onChangeEqualizer={handleEqualizerChange}
      />

      <SleepTimerModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        activeSecondsRemaining={sleepTimerSeconds}
        onStartTimer={handleStartSleepTimer}
        onClearTimer={handleClearSleepTimer}
      />

      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => {
          setIsStationModalOpen(false);
          setEditingStation(null);
        }}
        stationToEdit={editingStation}
        folders={folders}
        onSaveCustomStation={handleSaveCustomStation}
        onUpdateStationDetails={handleUpdateStationDetails}
      />

      <PresetAssignModal
        isOpen={presetModalSlot !== null}
        onClose={() => setPresetModalSlot(null)}
        slotNumber={presetModalSlot}
        favorites={favorites}
        currentStation={currentStation}
        onAssign={(station, slot) => {
          assignPreset(station, slot);
          showToast(`Mapped "${station.name}" to Hardware Preset ${slot}`);
        }}
      />
    </div>
  );
}
