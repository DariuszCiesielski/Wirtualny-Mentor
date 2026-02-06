"use server";

/**
 * Profile Server Actions
 *
 * Handles profile updates including name and avatar.
 * Supports mock auth mode for testing without Supabase.
 */

import { z } from "zod/v4";
import { verifySession } from "@/lib/dal/auth";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Check if mock auth is enabled
function isMockAuth(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
}

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Imię jest wymagane")
    .max(100, "Imię może mieć maksymalnie 100 znaków"),
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

    // Mock auth mode
    if (isMockAuth()) {
      const cookieStore = await cookies();
      const mockUserCookie = cookieStore.get("mock_auth_user");

      if (mockUserCookie?.value) {
        const mockUser = JSON.parse(mockUserCookie.value);
        mockUser.user_metadata = {
          ...mockUser.user_metadata,
          full_name: result.data.name,
        };

        cookieStore.set("mock_auth_user", JSON.stringify(mockUser), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });

        revalidatePath("/profile");
        revalidatePath("/dashboard");
        return { success: true };
      }
    }

    // Real Supabase auth
    const supabase = await createClient();

    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: { full_name: result.data.name },
    });

    if (error) {
      return { error: "Nie udało się zaktualizować profilu" };
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Wystąpił błąd podczas aktualizacji profilu" };
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
      return { error: "Wybierz plik do przesłania" };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Plik może mieć maksymalnie 2MB" };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Dozwolone formaty: JPEG, PNG, GIF, WebP" };
    }

    // Mock auth mode - use a placeholder avatar
    if (isMockAuth()) {
      const cookieStore = await cookies();
      const mockUserCookie = cookieStore.get("mock_auth_user");

      if (mockUserCookie?.value) {
        const mockUser = JSON.parse(mockUserCookie.value);
        // Use a placeholder avatar URL based on user email
        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(mockUser.email)}&backgroundColor=3b82f6`;

        mockUser.user_metadata = {
          ...mockUser.user_metadata,
          avatar_url: avatarUrl,
        };

        cookieStore.set("mock_auth_user", JSON.stringify(mockUser), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });

        revalidatePath("/profile");
        revalidatePath("/dashboard");
        return { success: true, url: avatarUrl };
      }
    }

    // Real Supabase auth
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
      return { error: "Nie udało się przesłać pliku" };
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
      return { error: "Nie udało się zaktualizować avatara" };
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true, url: publicUrl };
  } catch {
    return { error: "Wystąpił błąd podczas przesyłania avatara" };
  }
}
