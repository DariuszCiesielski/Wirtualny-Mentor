"use server";

/**
 * Profile Server Actions
 *
 * Handles profile updates including name and avatar.
 */

import { z } from "zod/v4";
import { verifySession } from "@/lib/dal/auth";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Imie jest wymagane")
    .max(100, "Imie moze miec maksymalnie 100 znakow"),
});

export type ProfileFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: { name?: string[] };
};

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  try {
    // Verify user is authenticated
    await verifySession();

    // Validate form data
    const result = profileSchema.safeParse({
      name: formData.get("name"),
    });

    if (!result.success) {
      const flattened = result.error.flatten();
      return {
        fieldErrors: flattened.fieldErrors as { name?: string[] },
      };
    }

    const supabase = await createClient();

    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: { full_name: result.data.name },
    });

    if (error) {
      return { error: "Nie udalo sie zaktualizowac profilu" };
    }

    return { success: true };
  } catch {
    return { error: "Wystapil blad podczas aktualizacji profilu" };
  }
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export type AvatarFormState = {
  success?: boolean;
  url?: string;
  error?: string;
};

export async function uploadAvatar(
  _prevState: AvatarFormState,
  formData: FormData
): Promise<AvatarFormState> {
  try {
    // Verify user is authenticated
    const user = await verifySession();

    // Get file from form data
    const file = formData.get("avatar") as File | null;

    if (!file || file.size === 0) {
      return { error: "Wybierz plik do przeslania" };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Plik moze miec maksymalnie 2MB" };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Dozwolone formaty: JPEG, PNG, GIF, WebP" };
    }

    const supabase = await createClient();

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${user.id}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filename, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return { error: "Nie udalo sie przeslac pliku" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filename);

    // Update user metadata with new avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (updateError) {
      return { error: "Nie udalo sie zaktualizowac avatara" };
    }

    return { success: true, url: publicUrl };
  } catch {
    return { error: "Wystapil blad podczas przesylania avatara" };
  }
}
