import React, { useState, useMemo } from 'react';
import { Station, FavoriteItem, Folder } from '../types/radio';
import {
  FolderPlus,
  Play,
  Pause,
  Trash2,
  Edit2,
  Tag,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Plus,
  Folder as FolderIcon,
  Check,
  FileText,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface FavoritesManagerProps {
  favorites: FavoriteItem[];
  folders: Folder[];
  currentStation: Station | null;
  isPlaying: boolean;
  onPlayStation: (station: Station) => void;
  onToggleFavorite: (station: Station) => void;
  onUpdateFavorite: (stationId: string, updates: Partial<FavoriteItem>) => void;
  onAssignPreset: (station: Station, slot: number) => void;
  onAddFolder: (name: string, color: string) => void;
  onRenameFolder: (id: string, name: string, color?: string) => void;
  onDeleteFolder: (id: string) => void;
  onEditStation: (station: Station) => void;
  onNavigateToDirectory: () => void;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  favorites,
  folders,
  currentStation,
  isPlaying,
  onPlayStation,
  onToggleFavorite,
  onUpdateFavorite,
  onAssignPreset,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onEditStation,
  onNavigateToDirectory,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'added' | 'name' | 'playCount' | 'bitrate'>('added');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#38bdf8');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [tagInputId, setTagInputId] = useState<string | null>(null);
  const [tempTag, setTempTag] = useState('');

  const FOLDER_COLORS = ['#38bdf8', '#a855f7', '#34d399', '#fbbf24', '#f87171', '#ec4899', '#6366f1'];

  // Filtered & Sorted stations
  const filteredFavorites = useMemo(() => {
    return favorites
      .filter((fav) => {
        // Folder filter
        if (selectedFolderId !== 'all') {
          if (fav.folderId !== selectedFolderId) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = fav.station.name.toLowerCase().includes(q);
          const matchGenre = fav.station.genre.toLowerCase().includes(q);
          const matchEnsemble = fav.station.ensemble.toLowerCase().includes(q);
          const matchTags = fav.tags.some((t) => t.toLowerCase().includes(q));
          const matchNotes = (fav.notes || '').toLowerCase().includes(q);
          return matchName || matchGenre || matchEnsemble || matchTags || matchNotes;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.station.name.localeCompare(b.station.name);
        }
        if (sortBy === 'playCount') {
          return (b.playCount || 0) - (a.playCount || 0);
        }
        if (sortBy === 'bitrate') {
          return (b.station.bitrate || 0) - (a.station.bitrate || 0);
        }
        return (b.addedAt || 0) - (a.addedAt || 0);
      });
  }, [favorites, selectedFolderId, searchQuery, sortBy]);

  // Folder station count lookup
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    favorites.forEach((fav) => {
      if (fav.folderId) {
        counts[fav.folderId] = (counts[fav.folderId] || 0) + 1;
      }
    });
    return counts;
  }, [favorites]);

  const handleOpenCreateFolder = () => {
    setEditingFolder(null);
    setNewFolderName('');
    setNewFolderColor('#38bdf8');
    setShowFolderModal(true);
  };

  const handleOpenEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color);
    setShowFolderModal(true);
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    if (editingFolder) {
      onRenameFolder(editingFolder.id, newFolderName.trim(), newFolderColor);
    } else {
      onAddFolder(newFolderName.trim(), newFolderColor);
    }
    setShowFolderModal(false);
  };

  const handleSaveNotes = (stationId: string) => {
    onUpdateFavorite(stationId, { notes: tempNotes.trim() });
    setEditingNotesId(null);
  };

  const handleAddTag = (stationId: string, currentTags: string[]) => {
    const cleanTag = tempTag.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;
    if (!currentTags.includes(cleanTag)) {
      onUpdateFavorite(stationId, { tags: [...currentTags, cleanTag] });
    }
    setTempTag('');
    setTagInputId(null);
  };

  const handleRemoveTag = (stationId: string, currentTags: string[], tagToRemove: string) => {
    onUpdateFavorite(stationId, {
      tags: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Left Sidebar: Folder Collections */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Station Folders
            </span>
            <button
              onClick={handleOpenCreateFolder}
              className="cursor-pointer text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Folder</span>
            </button>
          </div>

          <div className="space-y-1">
            {/* All Favorites */}
            <button
              onClick={() => setSelectedFolderId('all')}
              className={`cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedFolderId === 'all'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-neutral-300 hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <FolderIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">All Saved Stations</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {favorites.length}
              </span>
            </button>

            {/* Custom Folders */}
            {folders.map((folder) => {
              const count = folderCounts[folder.id] || 0;
              const isSelected = selectedFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-100 font-semibold border border-neutral-700'
                      : 'text-neutral-300 hover:bg-neutral-800/40'
                  }`}
                >
                  <button
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="cursor-pointer flex items-center gap-2.5 flex-1 truncate text-left"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                      {count}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditFolder(folder);
                      }}
                      title="Edit folder"
                      className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-200 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${folder.name}"? Stations will be kept unassigned.`)) {
                          onDeleteFolder(folder.id);
                          if (selectedFolderId === folder.id) setSelectedFolderId('all');
                        }
                      }}
                      title="Delete folder"
                      className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tips on DAB Tuning */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-400 space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-wider text-amber-500 font-semibold block">
            DAB+ Tuning Tip
          </span>
          <p className="leading-relaxed text-[11.5px]">
            Assign your top 10 stations to quick hardware preset slots (P1–P10) for instant 1-click tuning anytime.
          </p>
        </div>
      </div>

      {/* 2. Main Area: Stations Grid with search, filter, and sorting */}
      <div className="lg:col-span-9 space-y-4">
        {/* Search, Filter & Sort Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-xl">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by station name, genre, tag, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-300 absolute right-3 top-1/2 -translate-y-1/2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-neutral-400 flex items-center gap-1 font-mono">
              <ArrowUpDown className="w-3 h-3 text-neutral-400" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              <option value="added">Recently Added</option>
              <option value="name">Station Name (A–Z)</option>
              <option value="playCount">Most Listened</option>
              <option value="bitrate">Bitrate (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Stations List */}
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-16 px-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
            <Radio className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-200">No stations match your criteria</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 mb-5">
              {searchQuery
                ? 'Try clearing your search query or choosing another folder.'
                : 'Your favorites collection is empty in this folder. Explore curated DAB ensembles or add custom streams.'}
            </p>
            <button
              onClick={onNavigateToDirectory}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              Browse DAB+ Ensembles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFavorites.map((fav) => {
              const isCurrent = currentStation && currentStation.id === fav.stationId;
              const isCurrentPlaying = isCurrent && isPlaying;
              const currentFolder = folders.find((f) => f.id === fav.folderId);

              return (
                <div
                  key={fav.stationId}
                  className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-neutral-900/90 border-amber-500/50 shadow-[0_4px_20px_rgba(245,158,11,0.08)]'
                      : 'bg-neutral-900/70 border-neutral-800/80 hover:border-neutral-700/80'
                  }`}
                >
                  {/* Top card bar: Logo / Icon, Title & Primary Play Action */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Play / Pause button */}
                        <button
                          onClick={() => onPlayStation(fav.station)}
                          title={isCurrentPlaying ? 'Pause' : 'Play Live Broadcast'}
                          className={`cursor-pointer w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                            isCurrentPlaying
                              ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                          }`}
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-neutral-100 truncate">
                              {fav.station.name}
                            </h4>
                            {fav.presetIndex && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 shrink-0">
                                P{String(fav.presetIndex).padStart(2, '0')}
                              </span>
                            )}
                          </div>

                          {/* Unboxed metadata with typographic separators */}
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5 truncate">
                            <span className="truncate">{fav.station.ensemble}</span>
                            <span aria-hidden="true">·</span>
                            <span>{fav.station.block}</span>
                            <span aria-hidden="true">·</span>
                            <span>{fav.station.bitrate}k {fav.station.codec}</span>
                          </div>
                        </div>
                      </div>

                      {/* Favorite star toggle */}
                      <button
                        onClick={() => onToggleFavorite(fav.station)}
                        title="Remove from favorites"
                        className="cursor-pointer p-1.5 rounded-md text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Genre & Country */}
                    <div className="mt-2 text-[11px] text-neutral-400 truncate">
                      <span>{fav.station.genre}</span>
                      <span className="mx-1 text-neutral-600">·</span>
                      <span className="text-neutral-500">{fav.station.countryName}</span>
                    </div>

                    {/* User Notes Section */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-800/80">
                      {editingNotesId === fav.stationId ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Add your notes (e.g. Schedule, favorite presenter, genre notes)..."
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                            rows={2}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="cursor-pointer px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNotes(fav.stationId)}
                              className="cursor-pointer px-2.5 py-1 text-[11px] font-semibold bg-amber-400 text-neutral-950 rounded hover:bg-amber-300"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNotesId(fav.stationId);
                            setTempNotes(fav.notes || '');
                          }}
                          className="cursor-pointer group flex items-start gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                          <p className="italic line-clamp-2">
                            {fav.notes || (
                              <span className="not-italic text-neutral-600 group-hover:text-neutral-400">
                                Click to add personal note or broadcast schedule...
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Tags List */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {fav.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-neutral-200 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800"
                        >
                          <span>#{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(fav.stationId, fav.tags, tag)}
                            className="cursor-pointer text-neutral-500 hover:text-rose-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {tagInputId === fav.stationId ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="tag..."
                            value={tempTag}
                            onChange={(e) => setTempTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddTag(fav.stationId, fav.tags);
                              if (e.key === 'Escape') setTagInputId(null);
                            }}
                            autoFocus
                            className="w-16 bg-neutral-950 border border-neutral-700 text-[10px] text-neutral-200 px-1 py-0.5 rounded focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddTag(fav.stationId, fav.tags)}
                            className="cursor-pointer text-[10px] text-amber-400"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setTagInputId(fav.stationId);
                            setTempTag('');
                          }}
                          className="cursor-pointer text-[10px] text-neutral-500 hover:text-neutral-300 flex items-center gap-0.5"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>+ tag</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom card bar: Folder assignment & Preset assignment */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-xs">
                    {/* Folder selector dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: currentFolder?.color || '#52525b' }}
                      />
                      <select
                        value={fav.folderId || ''}
                        onChange={(e) =>
                          onUpdateFavorite(fav.stationId, { folderId: e.target.value || undefined })
                        }
                        className="cursor-pointer bg-neutral-950 text-neutral-300 border border-neutral-800 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-amber-500 max-w-[130px] truncate"
                      >
                        <option value="">No Folder</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preset Slot selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-neutral-500">Preset:</span>
                      <select
                        value={fav.presetIndex || ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          if (val) {
                            onAssignPreset(fav.station, val);
                          } else {
                            onUpdateFavorite(fav.stationId, { presetIndex: undefined });
                          }
                        }}
                        className="cursor-pointer bg-neutral-950 text-neutral-300 border border-neutral-800 rounded px-1.5 py-1 text-[11px] font-mono focus:outline-none focus:border-amber-500"
                      >
                        <option value="">None</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => (
                          <option key={slot} value={slot}>
                            P{slot}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Edit Station details */}
                    <button
                      onClick={() => onEditStation(fav.station)}
                      title="Edit Station Stream or Details"
                      className="cursor-pointer p-1 text-neutral-500 hover:text-neutral-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold text-neutral-100 mb-3">
              {editingFolder ? 'Edit Folder' : 'Create New Folder'}
            </h3>

            <form onSubmit={handleSaveFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Late Night Lo-Fi, Work Focus..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  Folder Color Accent
                </label>
                <div className="flex items-center gap-2">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFolderColor(color)}
                      className={`cursor-pointer w-6 h-6 rounded-full transition-transform ${
                        newFolderColor === color ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="cursor-pointer px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-1.5 text-xs font-semibold bg-amber-400 text-neutral-950 rounded-lg hover:bg-amber-300"
                >
                  {editingFolder ? 'Save Changes' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
