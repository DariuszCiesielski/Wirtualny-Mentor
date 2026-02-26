"use client";

import { useRef } from "react";
import {
  Headphones,
  Volume2,
  CloudRain,
  Trees,
  Waves,
  Coffee,
  Radio,
  Upload,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BINAURAL_PRESETS,
  AMBIENT_SOUNDS,
  type AmbientSound,
} from "@/lib/focus/audio-presets";
import { useFocusContext } from "./focus-context";
import { toast } from "sonner";

const AMBIENT_ICONS: Record<string, React.ElementType> = {
  rain: CloudRain,
  cafe: Coffee,
  forest: Trees,
  ocean: Waves,
  whitenoise: Radio,
};

export function SoundMixer() {
  const { sounds, customSounds } = useFocusContext();

  return (
    <div className="space-y-4">
      {/* Binaural Beats */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Headphones className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Binaural Beats</span>
          <Badge
            variant="outline"
            className="ml-auto text-[10px] px-1.5 py-0"
          >
            Wymaga słuchawek
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BINAURAL_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              size="sm"
              variant={
                sounds.activeBinaural === preset.id ? "default" : "outline"
              }
              className="h-7 text-xs"
              onClick={() => {
                if (sounds.activeBinaural === preset.id) {
                  sounds.stopBinaural();
                } else {
                  sounds.startBinaural(preset);
                }
              }}
              title={preset.description}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {sounds.activeBinaural && (
          <div className="flex items-center gap-2">
            <Volume2 className="h-3 w-3 text-muted-foreground" />
            <Slider
              value={[sounds.binauralVolume * 100]}
              onValueChange={([v]) => sounds.setBinauralVolume(v / 100)}
              max={100}
              step={5}
              className="flex-1"
            />
          </div>
        )}
      </div>

      {/* Ambient Sounds */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <CloudRain className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Dźwięki otoczenia</span>
        </div>

        <div className="space-y-1.5">
          {AMBIENT_SOUNDS.map((sound: AmbientSound) => (
            <AmbientSoundRow
              key={sound.id}
              sound={sound}
              isActive={sounds.activeAmbients.has(sound.id)}
              volume={sounds.ambientVolumes[sound.id] ?? 0.5}
              isCustom={!!customSounds.customSounds[sound.id]}
              customFilename={customSounds.customSounds[sound.id]?.filename}
              uploadProgress={
                customSounds.uploadState?.slotId === sound.id
                  ? customSounds.uploadState.progress
                  : null
              }
              onToggle={() => sounds.toggleAmbient(sound)}
              onVolumeChange={(v) => sounds.setAmbientVolume(sound.id, v)}
              onUpload={(file) => {
                customSounds
                  .uploadSound(sound.id, file)
                  .catch((err: Error) => {
                    toast.error(`Błąd uploadu: ${err.message}`);
                  });
              }}
              onRemove={() => {
                customSounds.removeSound(sound.id);
                toast("Przywrócono domyślny dźwięk");
              }}
            />
          ))}
        </div>
      </div>

      {/* Master Volume */}
      <div className="flex items-center gap-2 pt-1 border-t">
        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Głośność:</span>
        <Slider
          value={[sounds.masterVolume * 100]}
          onValueChange={([v]) => sounds.setMasterVolume(v / 100)}
          max={100}
          step={5}
          className="flex-1"
        />
      </div>
    </div>
  );
}

interface AmbientSoundRowProps {
  sound: AmbientSound;
  isActive: boolean;
  volume: number;
  isCustom: boolean;
  customFilename?: string;
  uploadProgress: "uploading" | "done" | "error" | null;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

function AmbientSoundRow({
  sound,
  isActive,
  volume,
  isCustom,
  customFilename,
  uploadProgress,
  onToggle,
  onVolumeChange,
  onUpload,
  onRemove,
}: AmbientSoundRowProps) {
  const Icon = AMBIENT_ICONS[sound.id] || Radio;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors min-w-0",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {isCustom ? customFilename || sound.label : sound.label}
          </span>
          {isCustom && (
            <Badge
              variant="secondary"
              className="text-[9px] px-1 py-0 leading-tight shrink-0"
            >
              Własny
            </Badge>
          )}
          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
          )}
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          {uploadProgress === "uploading" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          {uploadProgress === "done" && (
            <Check className="h-3.5 w-3.5 text-green-500" />
          )}
          {!uploadProgress && isCustom && (
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Przywróć domyślny dźwięk"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {!uploadProgress && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Wgraj własny plik MP3"
            >
              <Upload className="h-3 w-3" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,audio/mpeg,audio/mp3"
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      {isActive && (
        <div className="flex items-center gap-2 px-2">
          <Volume2 className="h-3 w-3 text-muted-foreground" />
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => onVolumeChange(v / 100)}
            max={100}
            step={5}
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
}
