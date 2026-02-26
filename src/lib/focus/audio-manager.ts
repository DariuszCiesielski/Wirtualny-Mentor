/**
 * AudioManager
 *
 * Singleton managing binaural beats (Web Audio API oscillators)
 * and ambient sounds (HTML audio elements routed through Web Audio).
 * Lazy-initializes AudioContext on first user interaction.
 */

import type { BinauralPreset } from "./audio-presets";

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private binauralNodes: {
    left: OscillatorNode;
    right: OscillatorNode;
    merger: ChannelMergerNode;
    gain: GainNode;
  } | null = null;
  private ambientEntries = new Map<
    string,
    { element: HTMLAudioElement; gain: GainNode }
  >();

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === "suspended") {
      this.context.resume();
    }
    return this.context;
  }

  // --- Binaural Beats ---

  startBinaural(preset: BinauralPreset, volume = 0.3): void {
    this.stopBinaural();
    const ctx = this.ensureContext();

    const left = ctx.createOscillator();
    left.frequency.value = preset.carrierHz;

    const right = ctx.createOscillator();
    right.frequency.value = preset.carrierHz + preset.beatHz;

    const merger = ctx.createChannelMerger(2);
    const gain = ctx.createGain();
    gain.gain.value = volume;

    left.connect(merger, 0, 0);
    right.connect(merger, 0, 1);
    merger.connect(gain);
    gain.connect(this.masterGain!);

    left.start();
    right.start();
    this.binauralNodes = { left, right, merger, gain };
  }

  stopBinaural(): void {
    if (this.binauralNodes) {
      this.binauralNodes.left.stop();
      this.binauralNodes.right.stop();
      this.binauralNodes.gain.disconnect();
      this.binauralNodes = null;
    }
  }

  setBinauralVolume(volume: number): void {
    if (this.binauralNodes && this.context) {
      this.binauralNodes.gain.gain.setTargetAtTime(
        volume,
        this.context.currentTime,
        0.1
      );
    }
  }

  get isBinauralPlaying(): boolean {
    return this.binauralNodes !== null;
  }

  // --- Ambient Sounds ---

  startAmbient(id: string, filenameOrUrl: string, volume = 0.5): void {
    if (this.ambientEntries.has(id)) return;
    const ctx = this.ensureContext();

    const src = filenameOrUrl.startsWith("http")
      ? filenameOrUrl
      : `/sounds/${filenameOrUrl}`;
    const element = new Audio(src);
    element.loop = true;
    element.crossOrigin = "anonymous";

    const source = ctx.createMediaElementSource(element);
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.masterGain!);

    element.play().catch(() => {
      // Autoplay policy — will play on next user gesture
    });
    this.ambientEntries.set(id, { element, gain });
  }

  stopAmbient(id: string): void {
    const entry = this.ambientEntries.get(id);
    if (entry) {
      entry.element.pause();
      entry.element.src = "";
      entry.gain.disconnect();
      this.ambientEntries.delete(id);
    }
  }

  toggleAmbient(id: string, filename: string, volume = 0.5): void {
    if (this.ambientEntries.has(id)) {
      this.stopAmbient(id);
    } else {
      this.startAmbient(id, filename, volume);
    }
  }

  setAmbientVolume(id: string, volume: number): void {
    const entry = this.ambientEntries.get(id);
    if (entry && this.context) {
      entry.gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
    }
  }

  isAmbientPlaying(id: string): boolean {
    return this.ambientEntries.has(id);
  }

  get activeAmbientIds(): string[] {
    return Array.from(this.ambientEntries.keys());
  }

  // --- Master ---

  setMasterVolume(volume: number): void {
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(
        volume,
        this.context.currentTime,
        0.1
      );
    }
  }

  stopAll(): void {
    this.stopBinaural();
    const ids = Array.from(this.ambientEntries.keys());
    for (const id of ids) {
      this.stopAmbient(id);
    }
  }

  destroy(): void {
    this.stopAll();
    this.context?.close();
    this.context = null;
    this.masterGain = null;
  }
}

// Lazy singleton — SSR-safe, initialized on first access in browser
let _instance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!_instance) {
    _instance = new AudioManager();
  }
  return _instance;
}

/** @deprecated Use getAudioManager() for SSR safety */
export const audioManager =
  typeof window !== "undefined" ? getAudioManager() : (null as unknown as AudioManager);
