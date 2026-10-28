import React, { useState, useEffect } from 'react';
import { Station, Folder } from '../types/radio';
import { X, Radio, Check, Play, Volume2 } from 'lucide-react';

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationToEdit: Station | null;
  folders: Folder[];
  onSaveCustomStation: (
    stationData: Omit<Station, 'id' | 'isCustom'>,
    folderId?: string,
    presetSlot?: number
  ) => void;
  onUpdateStationDetails: (stationId: string, updates: Partial<Station>) => void;
}

export const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  onClose,
  stationToEdit,
  folders,
  onSaveCustomStation,
  onUpdateStationDetails,
}) => {
  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [ensemble, setEnsemble] = useState('Local DAB+ Ensemble');
  const [block, setBlock] = useState('11D');
  const [frequency, setFrequency] = useState('222.064 MHz');
  const [bitrate, setBitrate] = useState<number>(128);
  const [codec, setCodec] = useState<Station['codec']>('AAC+');
  const [genre, setGenre] = useState('');
  const [countryName, setCountryName] = useState('United Kingdom');
  const [country, setCountry] = useState('GB');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [presetSlot, setPresetSlot] = useState<string>('');
  const [testAudioPlaying, setTestAudioPlaying] = useState(false);
  const [testAudioError, setTestAudioError] = useState(false);

  useEffect(() => {
    if (stationToEdit) {
      setName(stationToEdit.name);
      setStreamUrl(stationToEdit.streamUrl);
      setFallbackUrl(stationToEdit.fallbackUrl || '');
      setEnsemble(stationToEdit.ensemble);
      setBlock(stationToEdit.block);
      setFrequency(stationToEdit.frequency || '225.648 MHz');
      setBitrate(stationToEdit.bitrate);
      setCodec(stationToEdit.codec);
      setGenre(stationToEdit.genre);
      setCountryName(stationToEdit.countryName);
      setCountry(stationToEdit.country);
    } else {
      setName('');
      setStreamUrl('');
      setFallbackUrl('');
      setEnsemble('Digital Audio Mux 1');
      setBlock('11A');
      setFrequency('216.928 MHz');
      setBitrate(128);
      setCodec('AAC+');
      setGenre('Music & Talk');
      setCountryName('Worldwide');
      setCountry('WW');
      setSelectedFolderId('');
      setPresetSlot('');
    }
    setTestAudioPlaying(false);
    setTestAudioError(false);
  }, [stationToEdit, isOpen]);

  if (!isOpen) return null;

  const handleTestAudio = () => {
    if (!streamUrl.trim()) return;
    const audio = new Audio(streamUrl.trim());
    setTestAudioPlaying(true);
    setTestAudioError(false);
    audio
      .play()
      .then(() => {
        setTimeout(() => {
          audio.pause();
          setTestAudioPlaying(false);
        }, 5000);
      })
      .catch(() => {
        setTestAudioPlaying(false);
        setTestAudioError(true);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) return;

    if (stationToEdit) {
      onUpdateStationDetails(stationToEdit.id, {
        name: name.trim(),
        streamUrl: streamUrl.trim(),
        fallbackUrl: fallbackUrl.trim() || undefined,
        ensemble: ensemble.trim(),
        block: block.trim(),
        frequency: frequency.trim(),
        bitrate,
        codec,
        genre: genre.trim(),
        country,
        countryName,
      });
    } else {
      onSaveCustomStation(
        {
          name: name.trim(),
          streamUrl: streamUrl.trim(),
          fallbackUrl: fallbackUrl.trim() || undefined,
          ensemble: ensemble.trim(),
          block: block.trim(),
          frequency: frequency.trim(),
          bitrate,
          codec,
          genre: genre.trim(),
          country,
          countryName,
        },
        selectedFolderId || undefined,
        presetSlot ? parseInt(presetSlot, 10) : undefined
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl my-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-amber-500">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                {stationToEdit ? 'Edit Station Details' : 'Add Custom DAB+ Radio Stream'}
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Direct MP3 / AAC / HLS HTTP(S) live audio stream
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Station Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Station Name <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NTS Radio, Jazz24, Radio Eins..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Stream URL & Test Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-neutral-300">
                Live Stream URL <span className="text-amber-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleTestAudio}
                className="cursor-pointer text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <Volume2 className="w-3 h-3" />
                <span>{testAudioPlaying ? 'Playing test (5s)...' : 'Test Stream Audio'}</span>
              </button>
            </div>
            <input
              type="url"
              required
              placeholder="https://stream.server.org/live.mp3"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
            />
            {testAudioError && (
              <p className="text-[11px] text-rose-400 mt-1">
                Stream test failed or blocked by browser CORS. It may still play directly in HTML5 audio.
              </p>
            )}
          </div>

          {/* Fallback URL */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Secondary / Fallback Stream URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://backup.stream.org/audio.aac"
              value={fallbackUrl}
              onChange={(e) => setFallbackUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* DAB Telemetry Specs (Ensemble & Frequency Block) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Ensemble / Multiplex Name
              </label>
              <input
                type="text"
                value={ensemble}
                onChange={(e) => setEnsemble(e.target.value)}
                placeholder="e.g. London 1 DAB, West Coast HD"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                DAB Frequency Block
              </label>
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="e.g. 11D, 12B, 7C, 5A"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Codec & Bitrate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Audio Codec
              </label>
              <select
                value={codec}
                onChange={(e) => setCodec(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="AAC+">AAC+ (DAB+ Standard)</option>
                <option value="MP2">MP2 (Classic DAB)</option>
                <option value="MP3">MP3</option>
                <option value="AAC">AAC-LC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Bitrate (kbps)
              </label>
              <input
                type="number"
                min="32"
                max="320"
                step="8"
                value={bitrate}
                onChange={(e) => setBitrate(parseInt(e.target.value, 10) || 128)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Genre & Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Genre
              </label>
              <input
                type="text"
                placeholder="e.g. Ambient, Jazz, Indie Rock"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Country
              </label>
              <input
                type="text"
                placeholder="e.g. United Kingdom, Germany"
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Assign to Folder & Preset Slot (when creating) */}
          {!stationToEdit && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Assign to Folder
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">No Folder (Unfiled)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Assign to Hardware Preset
                </label>
                <select
                  value={presetSlot}
                  onChange={(e) => setPresetSlot(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="">None</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => (
                    <option key={slot} value={slot}>
                      P{slot} (Preset {slot})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs rounded-lg transition-colors"
            >
              {stationToEdit ? 'Save Station Changes' : 'Add Station to Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
