import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sounds } = await supabase
    .from("user_ambient_sounds")
    .select("sound_slot_id, original_filename, storage_path, file_size")
    .eq("user_id", user.id);

  if (!sounds?.length) {
    return NextResponse.json({ customSounds: {} });
  }

  // Generate signed URLs for all custom sounds
  const customSounds: Record<
    string,
    { filename: string; signedUrl: string; fileSize: number }
  > = {};

  for (const sound of sounds) {
    const { data: urlData } = await supabase.storage
      .from("ambient-sounds")
      .createSignedUrl(sound.storage_path, 3600);

    if (urlData?.signedUrl) {
      customSounds[sound.sound_slot_id] = {
        filename: sound.original_filename,
        signedUrl: urlData.signedUrl,
        fileSize: sound.file_size,
      };
    }
  }

  return NextResponse.json({ customSounds });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slotId = searchParams.get("slotId");

  if (!slotId) {
    return NextResponse.json({ error: "Missing slotId" }, { status: 400 });
  }

  // Get storage path before deleting DB record
  const { data: existing } = await supabase
    .from("user_ambient_sounds")
    .select("storage_path")
    .eq("user_id", user.id)
    .eq("sound_slot_id", slotId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from Storage
  await supabase.storage.from("ambient-sounds").remove([existing.storage_path]);

  // Delete from DB
  await supabase
    .from("user_ambient_sounds")
    .delete()
    .eq("user_id", user.id)
    .eq("sound_slot_id", slotId);

  return NextResponse.json({ ok: true });
}
