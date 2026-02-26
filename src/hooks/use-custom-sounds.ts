"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface CustomSoundInfo {
  filename: string;
  signedUrl: string;
  fileSize: number;
}

export type CustomSoundsMap = Record<string, CustomSoundInfo>;

interface UploadState {
  slotId: string;
  progress: "uploading" | "done" | "error";
}

export function useCustomSounds() {
  const [customSounds, setCustomSounds] = useState<CustomSoundsMap>({});
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCustomSounds = useCallback(async () => {
    try {
      const res = await fetch("/api/focus/custom-sounds");
      if (!res.ok) return;
      const data = await res.json();
      setCustomSounds(data.customSounds || {});
    } catch {
      // Non-critical — fall back to default sounds
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount + schedule refresh every 50 min (signed URLs expire in 1h)
  useEffect(() => {
    loadCustomSounds();

    const scheduleRefresh = () => {
      refreshTimerRef.current = setTimeout(
        () => {
          loadCustomSounds();
          scheduleRefresh();
        },
        50 * 60 * 1000
      ); // 50 min
    };
    scheduleRefresh();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [loadCustomSounds]);

  const uploadSound = useCallback(
    async (slotId: string, file: File) => {
      setUploadState({ slotId, progress: "uploading" });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("soundSlotId", slotId);

        const res = await fetch("/api/focus/upload-sound", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        const data = await res.json();
        setCustomSounds((prev) => ({
          ...prev,
          [slotId]: {
            filename: data.filename,
            signedUrl: data.signedUrl,
            fileSize: file.size,
          },
        }));
        setUploadState({ slotId, progress: "done" });

        // Clear "done" state after 2s
        setTimeout(() => setUploadState(null), 2000);
        return data.signedUrl as string;
      } catch (err) {
        setUploadState({ slotId, progress: "error" });
        setTimeout(() => setUploadState(null), 3000);
        throw err;
      }
    },
    []
  );

  const removeSound = useCallback(async (slotId: string) => {
    try {
      await fetch(`/api/focus/custom-sounds?slotId=${slotId}`, {
        method: "DELETE",
      });
      setCustomSounds((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
    } catch {
      // Non-critical
    }
  }, []);

  const getCustomUrl = useCallback(
    (slotId: string): string | null => {
      return customSounds[slotId]?.signedUrl ?? null;
    },
    [customSounds]
  );

  return {
    customSounds,
    loading,
    uploadState,
    uploadSound,
    removeSound,
    getCustomUrl,
  };
}
