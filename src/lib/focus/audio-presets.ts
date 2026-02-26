/**
 * Audio Presets
 *
 * Binaural beat presets (Web Audio API generated) and
 * ambient sound definitions (file-based, pluggable).
 */

export interface BinauralPreset {
  id: string;
  label: string;
  carrierHz: number;
  beatHz: number;
  description: string;
}

export const BINAURAL_PRESETS: BinauralPreset[] = [
  {
    id: "gamma",
    label: "Fokus Gamma",
    carrierHz: 200,
    beatHz: 40,
    description: "Koncentracja i uwaga",
  },
  {
    id: "alpha",
    label: "Relaks Alpha",
    carrierHz: 150,
    beatHz: 10,
    description: "Spokojne skupienie",
  },
  {
    id: "theta",
    label: "Deep Focus Theta",
    carrierHz: 100,
    beatHz: 6,
    description: "Głęboka koncentracja",
  },
];

export interface AmbientSound {
  id: string;
  label: string;
  filename: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: "rain", label: "Deszcz", filename: "rain.mp3" },
  { id: "cafe", label: "Kawiarnia", filename: "cafe.mp3" },
  { id: "forest", label: "Las", filename: "forest.mp3" },
  { id: "ocean", label: "Ocean", filename: "ocean.mp3" },
  { id: "whitenoise", label: "Szum biały", filename: "whitenoise.mp3" },
];
