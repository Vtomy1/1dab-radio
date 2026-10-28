import { EqualizerSettings } from '../types/radio';

export const EQ_PRESETS: Record<string, EqualizerSettings> = {
  flat: { band60: 0, band250: 0, band1k: 0, band4k: 0, band12k: 0, preset: 'flat' },
  speech: { band60: -3, band250: 1, band1k: 4, band4k: 3, band12k: -2, preset: 'speech' },
  bass_boost: { band60: 6, band250: 4, band1k: 0, band4k: 1, band12k: 2, preset: 'bass_boost' },
  jazz: { band60: 3, band250: 2, band1k: -1, band4k: 2, band12k: 4, preset: 'jazz' },
  classical: { band60: 4, band250: 2, band1k: 0, band4k: 3, band12k: 5, preset: 'classical' },
  rock: { band60: 5, band250: 3, band1k: -1, band4k: 3, band12k: 6, preset: 'rock' },
};

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private isConnected = false;
  private isReceivingRealData = false;
  private sleepInterval: number | null = null;

  constructor() {
    // Lazy initialized on first user interaction
  }

  public init() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'none';
  }

  public getAudioElement(): HTMLAudioElement | null {
    if (!this.audio) this.init();
    return this.audio;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public isWebAudioLive(): boolean {
    return this.isConnected && this.isReceivingRealData;
  }

  private setupWebAudio() {
    if (this.isConnected || !this.audio) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128; // 64 frequency bins
      this.analyser.smoothingTimeConstant = 0.82;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      this.gainNode = this.audioCtx.createGain();

      // Create 5 EQ bands
      const freqs = [60, 250, 1000, 4000, 12000];
      const types: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];

      this.filters = freqs.map((freq, i) => {
        const f = this.audioCtx!.createBiquadFilter();
        f.type = types[i];
        f.frequency.value = freq;
        f.gain.value = 0;
        return f;
      });

      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

      // Chain: source -> filter0 -> filter1 -> ... -> filter4 -> gain -> analyser -> destination
      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.isConnected = true;
    } catch {
      // Cross-origin audio or browser restriction fallback:
      // Audio element plays directly through default audio output
      this.isConnected = false;
    }
  }

  public async play(url: string, fallbackUrl?: string): Promise<boolean> {
    this.init();
    if (!this.audio) return false;

    // Ensure AudioContext is resumed upon user gesture
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume().catch(() => {});
    }

    try {
      this.audio.src = url;
      await this.audio.play();
      this.setupWebAudio();
      return true;
    } catch {
      if (fallbackUrl) {
        try {
          this.audio.src = fallbackUrl;
          await this.audio.play();
          this.setupWebAudio();
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  public setVolume(vol: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  public applyEqualizer(settings: EqualizerSettings) {
    if (!this.isConnected || this.filters.length < 5) return;
    try {
      const gains = [
        settings.band60,
        settings.band250,
        settings.band1k,
        settings.band4k,
        settings.band12k,
      ];
      this.filters.forEach((filter, idx) => {
        filter.gain.setTargetAtTime(gains[idx] || 0, this.audioCtx!.currentTime, 0.05);
      });
    } catch {
      // Ignore audio param errors
    }
  }

  /**
   * Retrieves real-time frequency data from Web Audio AnalyserNode (0-255).
   * If CORS restricts media element analysis, provides rich music-harmonic fallback.
   */
  public getFrequencyData(array: Uint8Array): void {
    if (this.isConnected && this.analyser) {
      try {
        this.analyser.getByteFrequencyData(array as any);
        const sum = array.reduce((a, b) => a + b, 0);
        if (sum > 0) {
          this.isReceivingRealData = true;
          return;
        }
      } catch {
        // Fall through
      }
    }

    this.isReceivingRealData = false;

    // Responsive simulation when audio is active
    if (this.audio && !this.audio.paused) {
      const vol = this.audio.volume;
      const now = Date.now() / 140;
      const len = array.length;

      for (let i = 0; i < len; i++) {
        // Logarithmic frequency falloff curve: bass has higher energy, treble decays naturally
        const freqWeight = Math.pow(1 - (i / len) * 0.75, 1.2);
        const harmonic1 = Math.sin(now * 1.8 + i * 0.45) * 45;
        const harmonic2 = Math.cos(now * 0.9 - i * 0.28) * 35;
        const rhythmPulse = Math.sin(now * 0.6) > 0.4 ? 30 : 0;
        const noise = (Math.random() - 0.5) * 16;

        const val = (harmonic1 + harmonic2 + rhythmPulse + 115 + noise) * freqWeight * vol;
        array[i] = Math.max(6, Math.min(255, Math.floor(val)));
      }
    } else {
      array.fill(0);
    }
  }

  /**
   * Retrieves real-time time-domain / waveform data from Web Audio AnalyserNode.
   */
  public getTimeDomainData(array: Uint8Array): void {
    if (this.isConnected && this.analyser) {
      try {
        this.analyser.getByteTimeDomainData(array as any);
        const sum = array.reduce((a, b) => a + Math.abs(b - 128), 0);
        if (sum > 2) {
          return;
        }
      } catch {
        // Fall through
      }
    }

    // Waveform simulation when playing
    if (this.audio && !this.audio.paused) {
      const vol = this.audio.volume;
      const now = Date.now() / 80;
      const len = array.length;
      for (let i = 0; i < len; i++) {
        const rad = (i / len) * Math.PI * 6 + now;
        const sample = Math.sin(rad) * 40 * vol + Math.sin(rad * 2.3) * 20 * vol;
        array[i] = Math.max(0, Math.min(255, Math.floor(128 + sample)));
      }
    } else {
      array.fill(128); // 128 is center flatline for 8-bit PCM time-domain
    }
  }

  public startSleepTimer(minutes: number, onTick: (remainingSec: number) => void, onComplete: () => void) {
    this.clearSleepTimer();
    let totalSeconds = minutes * 60;
    onTick(totalSeconds);

    this.sleepInterval = window.setInterval(() => {
      totalSeconds -= 1;
      if (totalSeconds <= 0) {
        this.clearSleepTimer();
        this.pause();
        onComplete();
      } else {
        if (totalSeconds < 60 && this.audio) {
          const fadeFraction = totalSeconds / 60;
          this.audio.volume = Math.max(0.01, this.audio.volume * fadeFraction);
        }
        onTick(totalSeconds);
      }
    }, 1000);
  }

  public clearSleepTimer() {
    if (this.sleepInterval !== null) {
      clearInterval(this.sleepInterval);
      this.sleepInterval = null;
    }
  }
}

export const audioEngine = new AudioEngine();
