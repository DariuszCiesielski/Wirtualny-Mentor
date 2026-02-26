"use client";

/**
 * useFocusSounds
 *
 * React wrapper around AudioManager singleton.
 * Manages binaural beats and ambient sounds state.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { getAudioManager } from "@/lib/focus/audio-manager";
import type { AudioManager } from "@/lib/focus/audio-manager";
import type { BinauralPreset, AmbientSound } from "@/lib/focus/audio-presets";

export function useFocusSounds(
  getCustomUrl?: (slotId: string) => string | null
) {
  const managerRef = useRef<AudioManager | null>(null);
  const getManager = useCallback(() => {
    if (!managerRef.current) managerRef.current = getAudioManager();
    return managerRef.current;
  }, []);
  const [activeBinaural, setActiveBinauralState] = useState<string | null>(
    null
  );
  const [binauralVolume, setBinauralVolumeState] = useState(0.3);
  const [activeAmbients, setActiveAmbients] = useState<Set<string>>(new Set());
  const [ambientVolumes, setAmbientVolumes] = useState<Record<string, number>>(
    {}
  );
  const [masterVolume, setMasterVolumeState] = useState(0.7);

  // Binaural
  const startBinaural = useCallback(
    (preset: BinauralPreset) => {
      getManager().startBinaural(preset, binauralVolume);
      setActiveBinauralState(preset.id);
    },
    [binauralVolume]
  );

  const stopBinaural = useCallback(() => {
    getManager().stopBinaural();
    setActiveBinauralState(null);
  }, []);

  const setBinauralVolume = useCallback((volume: number) => {
    setBinauralVolumeState(volume);
    getManager().setBinauralVolume(volume);
  }, []);

  // Store getCustomUrl in ref to keep toggleAmbient stable
  const getCustomUrlRef = useRef(getCustomUrl);
  useEffect(() => { getCustomUrlRef.current = getCustomUrl; }, [getCustomUrl]);

  // Ambient
  const toggleAmbient = useCallback(
    (sound: AmbientSound) => {
      const volume = ambientVolumes[sound.id] ?? 0.5;
      // Use custom URL if available, otherwise fall back to default filename
      const customUrl = getCustomUrlRef.current?.(sound.id);
      const source = customUrl || sound.filename;
      getManager().toggleAmbient(sound.id, source, volume);

      setActiveAmbients((prev) => {
        const next = new Set(prev);
        if (next.has(sound.id)) {
          next.delete(sound.id);
        } else {
          next.add(sound.id);
        }
        return next;
      });
    },
    [ambientVolumes]
  );

  const setAmbientVolume = useCallback((id: string, volume: number) => {
    setAmbientVolumes((prev) => ({ ...prev, [id]: volume }));
    getManager().setAmbientVolume(id, volume);
  }, []);

  // Master
  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    getManager().setMasterVolume(volume);
  }, []);

  const stopAll = useCallback(() => {
    getManager().stopAll();
    setActiveBinauralState(null);
    setActiveAmbients(new Set());
  }, []);

  // Cleanup on unmount — stop sounds but preserve singleton
  // (component may remount e.g. React Strict Mode)
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.stopAll();
      }
    };
  }, []);

  return {
    // Binaural
    activeBinaural,
    binauralVolume,
    startBinaural,
    stopBinaural,
    setBinauralVolume,
    // Ambient
    activeAmbients,
    ambientVolumes,
    toggleAmbient,
    setAmbientVolume,
    // Master
    masterVolume,
    setMasterVolume,
    stopAll,
  };
}
