import { useState, useEffect } from 'react';
import { FavoriteItem, Folder, Station, EqualizerSettings, DisplayBacklight } from '../types/radio';
import { DEFAULT_STATIONS, INITIAL_FOLDERS } from '../data/defaultStations';
import { EQ_PRESETS } from '../services/audioEngine';

const STORAGE_KEYS = {
  FAVORITES: 'aether_dab_favorites_v1',
  FOLDERS: 'aether_dab_folders_v1',
  CUSTOM_STATIONS: 'aether_dab_custom_stations_v1',
  EQ: 'aether_dab_eq_v1',
  THEME: 'aether_dab_theme_v1',
  LAST_STATION: 'aether_dab_last_station_v1',
  VOLUME: 'aether_dab_volume_v1',
};

// Initial default favorites seeded from top stations
const INITIAL_FAVORITES: FavoriteItem[] = [
  {
    stationId: 'bbc-6music',
    station: DEFAULT_STATIONS[0],
    addedAt: Date.now() - 3600000 * 24,
    folderId: 'f-music-discoveries',
    tags: ['indie', 'curated', 'eclectic'],
    notes: 'Incredible presenter shows and live BBC Maida Vale sessions.',
    presetIndex: 1,
    playCount: 14,
  },
  {
    stationId: 'fip-paris',
    station: DEFAULT_STATIONS[7],
    addedAt: Date.now() - 3600000 * 20,
    folderId: 'f-music-discoveries',
    tags: ['french', 'world', 'jazz', 'seamless'],
    notes: 'Zero commercials, legendary eclectic mixes.',
    presetIndex: 2,
    playCount: 19,
  },
  {
    stationId: 'somafm-groovesalad',
    station: DEFAULT_STATIONS[15],
    addedAt: Date.now() - 3600000 * 18,
    folderId: 'f-chill',
    tags: ['ambient', 'work', 'focus'],
    notes: 'Go-to focus station for deep coding sessions.',
    presetIndex: 3,
    playCount: 22,
  },
  {
    stationId: 'swiss-classic',
    station: DEFAULT_STATIONS[9],
    addedAt: Date.now() - 3600000 * 12,
    folderId: 'f-classical',
    tags: ['classical', 'hifi', 'orchestral'],
    notes: 'Pristine acoustic dynamics and pure baroque / classical concertos.',
    presetIndex: 4,
    playCount: 8,
  },
  {
    stationId: 'bbc-world-service',
    station: DEFAULT_STATIONS[3],
    addedAt: Date.now() - 3600000 * 8,
    folderId: 'f-news',
    tags: ['global-news', 'documentary'],
    notes: 'Morning world affairs & international correspondents.',
    presetIndex: 5,
    playCount: 11,
  },
  {
    stationId: 'rock-antenne',
    station: DEFAULT_STATIONS[13],
    addedAt: Date.now() - 3600000 * 4,
    folderId: 'f-rock',
    tags: ['rock', 'classic-rock', 'german-mux'],
    notes: 'High energy drive-time rock.',
    presetIndex: 6,
    playCount: 6,
  },
];

export function useRadioStorage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : INITIAL_FAVORITES;
    } catch {
      return INITIAL_FAVORITES;
    }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch {
      return INITIAL_FOLDERS;
    }
  });

  const [customStations, setCustomStations] = useState<Station[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_STATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [equalizer, setEqualizer] = useState<EqualizerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EQ);
      return saved ? JSON.parse(saved) : EQ_PRESETS.flat;
    } catch {
      return EQ_PRESETS.flat;
    }
  });

  const [backlight, setBacklight] = useState<DisplayBacklight>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return (saved as DisplayBacklight) || 'amber';
    } catch {
      return 'amber';
    }
  });

  const [lastStationId, setLastStationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_STATION) || 'bbc-6music';
    } catch {
      return 'bbc-6music';
    }
  });

  const [savedVolume, setSavedVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOLUME);
      return saved !== null ? parseFloat(saved) : 0.8;
    } catch {
      return 0.8;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch {
      // storage quota or disabled
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    } catch {}
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_STATIONS, JSON.stringify(customStations));
    } catch {}
  }, [customStations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EQ, JSON.stringify(equalizer));
    } catch {}
  }, [equalizer]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, backlight);
    } catch {}
  }, [backlight]);

  useEffect(() => {
    if (lastStationId) {
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_STATION, lastStationId);
      } catch {}
    }
  }, [lastStationId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOLUME, savedVolume.toString());
    } catch {}
  }, [savedVolume]);

  // Favorites helpers
  const isFavorite = (stationId: string) => {
    return favorites.some((f) => f.stationId === stationId);
  };

  const toggleFavorite = (station: Station, folderId?: string) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.stationId === station.id);
      if (exists) {
        return prev.filter((f) => f.stationId !== station.id);
      } else {
        const newItem: FavoriteItem = {
          stationId: station.id,
          station,
          addedAt: Date.now(),
          folderId: folderId || undefined,
          tags: [station.genre.split('/')[0].trim().toLowerCase()],
          playCount: 1,
        };
        return [newItem, ...prev];
      }
    });
  };

  const updateFavoriteDetails = (
    stationId: string,
    updates: Partial<Omit<FavoriteItem, 'stationId' | 'station'>>
  ) => {
    setFavorites((prev) =>
      prev.map((fav) => {
        if (fav.stationId === stationId) {
          return { ...fav, ...updates };
        }
        return fav;
      })
    );
  };

  const updateStation = (stationId: string, updates: Partial<Station>) => {
    setFavorites((prev) =>
      prev.map((fav) => {
        if (fav.stationId === stationId) {
          return { ...fav, station: { ...fav.station, ...updates } };
        }
        return fav;
      })
    );
    setCustomStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, ...updates } : s))
    );
  };

  const assignPreset = (station: Station, presetNumber: number) => {
    if (presetNumber < 1 || presetNumber > 10) return;
    setFavorites((prev) => {
      // Clear previous holder of this presetNumber
      const updated = prev.map((f) => {
        if (f.presetIndex === presetNumber && f.stationId !== station.id) {
          return { ...f, presetIndex: undefined };
        }
        if (f.stationId === station.id) {
          return { ...f, presetIndex: presetNumber };
        }
        return f;
      });

      // If station was not already in favorites, add it
      if (!updated.some((f) => f.stationId === station.id)) {
        const newItem: FavoriteItem = {
          stationId: station.id,
          station,
          addedAt: Date.now(),
          tags: [],
          presetIndex: presetNumber,
          playCount: 1,
        };
        return [...updated, newItem];
      }
      return updated;
    });
  };

  const incrementPlayCount = (stationId: string) => {
    setFavorites((prev) =>
      prev.map((f) => {
        if (f.stationId === stationId) {
          return {
            ...f,
            playCount: (f.playCount || 0) + 1,
            lastPlayedAt: Date.now(),
          };
        }
        return f;
      })
    );
  };

  // Folder management
  const addFolder = (name: string, color: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newFolder: Folder = {
      id: `f-${Date.now().toString(36)}`,
      name: trimmed,
      color,
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder.id;
  };

  const renameFolder = (folderId: string, newName: string, newColor?: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, name: trimmed, color: newColor || f.color } : f
      )
    );
  };

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Unassign stations in that folder
    setFavorites((prev) =>
      prev.map((f) => (f.folderId === folderId ? { ...f, folderId: undefined } : f))
    );
  };

  // Custom station management
  const addCustomStation = (station: Omit<Station, 'id' | 'isCustom'>): Station => {
    const newStation: Station = {
      ...station,
      id: `custom-${Date.now().toString(36)}`,
      isCustom: true,
    };
    setCustomStations((prev) => [newStation, ...prev]);
    return newStation;
  };

  const removeCustomStation = (stationId: string) => {
    setCustomStations((prev) => prev.filter((s) => s.id !== stationId));
    setFavorites((prev) => prev.filter((f) => f.stationId !== stationId));
  };

  // Export & Import
  const exportData = () => {
    const exportPayload = {
      version: 1,
      appName: 'Aether DAB+ Digital Radio',
      exportedAt: new Date().toISOString(),
      favorites,
      folders,
      customStations,
      equalizer,
      backlight,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-dab-favorites-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.favorites)) {
        setFavorites(data.favorites);
      }
      if (Array.isArray(data.folders)) {
        setFolders(data.folders);
      }
      if (Array.isArray(data.customStations)) {
        setCustomStations(data.customStations);
      }
      if (data.equalizer) {
        setEqualizer(data.equalizer);
      }
      if (data.backlight) {
        setBacklight(data.backlight);
      }
      return { success: true, message: `Successfully restored ${data.favorites?.length || 0} favorites and ${data.folders?.length || 0} folders.` };
    } catch (e: any) {
      return { success: false, message: 'Invalid JSON backup format: ' + (e?.message || 'Parse error') };
    }
  };

  return {
    favorites,
    folders,
    customStations,
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
    removeCustomStation,
    exportData,
    importData,
  };
}
