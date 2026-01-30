"use client";

/**
 * Avatar Upload Component
 *
 * Allows user to preview and upload a new avatar image.
 */

import { useActionState, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, User } from "lucide-react";
import { uploadAvatar, type AvatarFormState } from "@/app/(dashboard)/profile/actions";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  initials: string;
}

const initialState: AvatarFormState = {};

export function AvatarUpload({ currentAvatarUrl, initials }: AvatarUploadProps) {
  const [state, formAction, pending] = useActionState(
    uploadAvatar,
    initialState
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Use uploaded URL, preview, or current avatar
  const displayUrl = state.url || previewUrl || currentAvatarUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleSubmit() {
    if (previewUrl && formRef.current) {
      formRef.current.requestSubmit();
    }
  }

  return (
    <div className="space-y-4">
      <Label>Avatar</Label>

      <div className="flex items-center gap-6">
        {/* Avatar preview */}
        <Avatar className="h-20 w-20">
          {displayUrl && <AvatarImage src={displayUrl} alt="Avatar" />}
          <AvatarFallback className="text-lg">
            {initials || <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>

        {/* Upload controls */}
        <div className="space-y-2">
          <form ref={formRef} action={formAction}>
            <input
              ref={fileInputRef}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={pending}
            />
          </form>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={pending}
            >
              <Upload className="h-4 w-4 mr-2" />
              Wybierz plik
            </Button>

            {previewUrl && (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={pending}
              >
                {pending ? "Przesylanie..." : "Zapisz avatar"}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Maksymalnie 2MB. JPEG, PNG, GIF lub WebP.
          </p>
        </div>
      </div>

      {state.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md">
          Avatar zostal zaktualizowany
        </div>
      )}
    </div>
  );
}
