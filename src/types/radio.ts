export interface Station {
  id: string;
  name: string;
  streamUrl: string;
  fallbackUrl?: string;
  ensemble: string; // e.g. "BBC National DAB", "Digital One", "Berlin Mux 7D"
  block: string; // e.g. "12B", "11D", "7D", "10A"
  frequency?: string; // e.g. "225.648 MHz"
  bitrate: number; // e.g. 128, 96, 80, 192 (kbps)
  codec: 'AAC+' | 'MP2' | 'MP3' | 'AAC';
  country: string; // "GB", "DE", "FR", "US", "CH", etc.
  countryName: string;
  genre: string;
  homepage?: string;
  logo?: string;
  isCustom?: boolean;
}

export interface FavoriteItem {
  stationId: string;
  station: Station;
  addedAt: number;
  folderId?: string; // Folder ID or undefined for unassigned
  tags: string[];
  notes?: string;
  presetIndex?: number; // 1-10 for quick preset buttons
  playCount: number;
  lastPlayedAt?: number;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: number;
}

export type DisplayBacklight = 'amber' | 'cyan' | 'phosphor' | 'monochrome';

export type DisplayScreenMode = 'dls' | 'spectrum' | 'technical' | 'equalizer';

export interface EqualizerSettings {
  band60: number;   // -12dB to +12dB
  band250: number;  // -12dB to +12dB
  band1k: number;   // -12dB to +12dB
  band4k: number;   // -12dB to +12dB
  band12k: number;  // -12dB to +12dB
  preset: string;
}

export interface RadioState {
  currentStation: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number; // 0 to 1
  isMuted: boolean;
  dlsText: string;
  signalStrength: number; // 0 to 100%
  errorRate: number; // 0.00%
  sleepTimerMinutes: number | null; // minutes remaining or null
}
