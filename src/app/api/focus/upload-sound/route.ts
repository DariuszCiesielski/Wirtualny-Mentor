import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_SLOTS = new Set(["rain", "cafe", "forest", "ocean", "whitenoise"]);

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const soundSlotId = formData.get("soundSlotId") as string | null;

  if (!file || !soundSlotId) {
    return NextResponse.json(
      { error: "Missing file or soundSlotId" },
      { status: 400 }
    );
  }

  if (!VALID_SLOTS.has(soundSlotId)) {
    return NextResponse.json(
      { error: `Invalid sound slot: ${soundSlotId}` },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("audio/")) {
    return NextResponse.json(
      { error: "Only audio files are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Plik jest za duży (max 10MB)" },
      { status: 400 }
    );
  }

  // Delete old file if exists
  const { data: existing } = await supabase
    .from("user_ambient_sounds")
    .select("storage_path")
    .eq("user_id", user.id)
    .eq("sound_slot_id", soundSlotId)
    .single();

  if (existing?.storage_path) {
    await supabase.storage.from("ambient-sounds").remove([existing.storage_path]);
  }

  // Upload new file
  const uuid = crypto.randomUUID();
  const storagePath = `${user.id}/${soundSlotId}_${uuid}.mp3`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("ambient-sounds")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Upsert DB record
  const { error: dbError } = await supabase
    .from("user_ambient_sounds")
    .upsert(
      {
        user_id: user.id,
        sound_slot_id: soundSlotId,
        original_filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
      },
      { onConflict: "user_id,sound_slot_id" }
    );

  if (dbError) {
    // Cleanup uploaded file on DB failure
    await supabase.storage.from("ambient-sounds").remove([storagePath]);
    return NextResponse.json(
      { error: `DB error: ${dbError.message}` },
      { status: 500 }
    );
  }

  // Return signed URL
  const { data: signedUrlData } = await supabase.storage
    .from("ambient-sounds")
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    soundSlotId,
    filename: file.name,
    signedUrl: signedUrlData?.signedUrl ?? null,
  });
}
