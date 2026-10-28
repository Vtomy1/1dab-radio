import React, { useState } from 'react';
import { Station, Folder } from '../types/radio';
import { DEFAULT_STATIONS } from '../data/defaultStations';
import { searchGlobalStations } from '../services/radioApi';
import { Search, Play, Pause, Heart, Radio, Plus, Check, Globe } from 'lucide-react';

interface StationDirectoryProps {
  currentStation: Station | null;
  isPlaying: boolean;
  folders: Folder[];
  isFavorite: (id: string) => boolean;
  onPlayStation: (station: Station) => void;
  onToggleFavorite: (station: Station, folderId?: string) => void;
  onOpenAddModal: () => void;
  viewMode: 'multiplex' | 'directory';
}

export const StationDirectory: React.FC<StationDirectoryProps> = ({
  currentStation,
  isPlaying,
  folders,
  isFavorite,
  onPlayStation,
  onToggleFavorite,
  onOpenAddModal,
  viewMode,
}) => {
  const [selectedEnsemble, setSelectedEnsemble] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Group default stations by ensemble
  const ensembles = Array.from(new Set(DEFAULT_STATIONS.map((s) => s.ensemble)));

  const filteredLocalStations = DEFAULT_STATIONS.filter((s) => {
    if (selectedEnsemble !== 'all' && s.ensemble !== selectedEnsemble) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q) ||
        s.ensemble.toLowerCase().includes(q) ||
        s.countryName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const stations = await searchGlobalStations(globalQuery.trim(), 28);
      setSearchResults(stations);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {viewMode === 'multiplex' ? (
        /* Curated Multiplex / Ensemble Browser */
        <div className="space-y-5">
          {/* Section banner & ensemble filter pills/tabs */}
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-500" />
                DAB / DAB+ Multiplex Ensembles
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Official digital audio broadcasting service ensembles transmitted on VHF Band III.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter stations or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 w-full sm:w-56"
              />
            </div>
          </div>

          {/* Ensemble Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedEnsemble('all')}
              className={`cursor-pointer px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedEnsemble === 'all'
                  ? 'bg-amber-400 text-neutral-950 font-semibold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              All Ensembles ({DEFAULT_STATIONS.length})
            </button>
            {ensembles.map((ens) => {
              const count = DEFAULT_STATIONS.filter((s) => s.ensemble === ens).length;
              return (
                <button
                  key={ens}
                  onClick={() => setSelectedEnsemble(ens)}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedEnsemble === ens
                      ? 'bg-amber-400 text-neutral-950 font-semibold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {ens} ({count})
                </button>
              );
            })}
          </div>

          {/* Stations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocalStations.map((station) => {
              const isCurrent = currentStation && currentStation.id === station.id;
              const isCurrentPlaying = isCurrent && isPlaying;
              const favorited = isFavorite(station.id);

              return (
                <div
                  key={station.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-neutral-900/90 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-amber-500 font-semibold block truncate">
                          {station.ensemble} · {station.block}
                        </span>
                        <h3 className="text-sm font-bold text-neutral-100 truncate mt-0.5">
                          {station.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => onToggleFavorite(station)}
                        title={favorited ? 'In Favorites' : 'Save to Favorites'}
                        className={`cursor-pointer p-1.5 rounded-md border transition-colors ${
                          favorited
                            ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                            : 'text-neutral-500 hover:text-rose-400 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                      {station.genre}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono mt-3">
                      <span>{station.bitrate} kbps {station.codec}</span>
                      <span>·</span>
                      <span>{station.countryName}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onPlayStation(station)}
                      className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isCurrentPlaying
                          ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Tune Broadcast</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onToggleFavorite(station)}
                      className={`cursor-pointer text-xs font-medium px-2 py-1 transition-colors ${
                        favorited ? 'text-rose-400' : 'text-neutral-400 hover:text-amber-400'
                      }`}
                    >
                      {favorited ? 'Saved in Library' : '+ Save to Station'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Global Station Search via open Radio Browser */
        <div className="space-y-5">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-500" />
                  Global Digital Radio Directory
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Search across 30,000+ public international broadcasts by station name, genre, or country.
                </p>
              </div>

              <button
                onClick={onOpenAddModal}
                className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom URL</span>
              </button>
            </div>

            <form onSubmit={handleGlobalSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g., BBC, Jazz FM, Rock Antenne, Radio Swiss, FIP, Sydney..."
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !globalQuery.trim()}
                className="cursor-pointer px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                {isSearching ? 'Scanning Band...' : 'Search Directory'}
              </button>
            </form>
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-mono text-neutral-400">
                  Search results for "{globalQuery}": {searchResults.length} stations found
                </span>
              </div>

              {searchResults.length === 0 && !isSearching ? (
                <div className="text-center py-12 bg-neutral-900/40 border border-neutral-800 rounded-xl">
                  <p className="text-xs text-neutral-400">
                    No stations found for this query. You can add any custom radio stream URL directly!
                  </p>
                  <button
                    onClick={onOpenAddModal}
                    className="cursor-pointer mt-3 px-3 py-1.5 bg-amber-400 text-neutral-950 text-xs font-semibold rounded-lg hover:bg-amber-300"
                  >
                    Add Custom Stream
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((station) => {
                    const isCurrent = currentStation && currentStation.id === station.id;
                    const isCurrentPlaying = isCurrent && isPlaying;
                    const favorited = isFavorite(station.id);

                    return (
                      <div
                        key={station.id}
                        className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-neutral-900/90 border-amber-500/50 shadow-md'
                            : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-mono uppercase text-amber-500 font-semibold block truncate">
                                {station.ensemble} · {station.block}
                              </span>
                              <h3 className="text-sm font-bold text-neutral-100 truncate mt-0.5">
                                {station.name}
                              </h3>
                            </div>

                            <button
                              onClick={() => onToggleFavorite(station)}
                              title={favorited ? 'In Favorites' : 'Save to Favorites'}
                              className={`cursor-pointer p-1.5 rounded-md border transition-colors ${
                                favorited
                                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                                  : 'text-neutral-500 hover:text-rose-400 border-neutral-800 hover:border-neutral-700'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500' : ''}`} />
                            </button>
                          </div>

                          <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                            {station.genre}
                          </p>

                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono mt-3">
                            <span>{station.bitrate} kbps {station.codec}</span>
                            <span>·</span>
                            <span>{station.countryName}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                          <button
                            onClick={() => onPlayStation(station)}
                            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isCurrentPlaying
                                ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                            }`}
                          >
                            {isCurrentPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Tune</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => onToggleFavorite(station)}
                            className={`cursor-pointer text-xs font-medium px-2 py-1 transition-colors ${
                              favorited ? 'text-rose-400' : 'text-neutral-400 hover:text-amber-400'
                            }`}
                          >
                            {favorited ? 'Saved in Library' : '+ Add to Favorites'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
