/**
 * Admin Users API — Update & Delete
 *
 * PATCH  /api/admin/users/[id] — update role/display_name
 * DELETE /api/admin/users/[id] — remove user from whitelist + auth
 */

import { requireAdmin } from "@/lib/dal/auth";
import {
  updateAllowedUser,
  deleteAllowedUser,
} from "@/lib/dal/admin-users";
import { z } from "zod";

export const runtime = "nodejs";

const updateUserSchema = z.object({
  role: z.enum(["admin", "user"]).optional(),
  display_name: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Nieprawidłowe dane",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await updateAllowedUser(id, parsed.data);
    return Response.json({ user: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nieznany błąd";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAdmin();
    const { id } = await params;

    await deleteAllowedUser(id, user.id);
    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nieznany błąd";
    const status = message.includes("Nie możesz usunąć") ? 403 : 500;
    return Response.json({ error: message }, { status });
  }
}
