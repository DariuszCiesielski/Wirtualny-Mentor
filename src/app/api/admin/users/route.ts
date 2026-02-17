/**
 * Admin Users API — List & Create
 *
 * GET  /api/admin/users — list all whitelist users
 * POST /api/admin/users — create a new user (auth + whitelist)
 */

import { requireAdmin } from "@/lib/dal/auth";
import {
  listAllowedUsers,
  createAllowedUser,
} from "@/lib/dal/admin-users";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const users = await listAllowedUsers();
    return Response.json({ users });
  } catch {
    return Response.json({ error: "Brak uprawnień" }, { status: 401 });
  }
}

const createUserSchema = z.object({
  email: z.string().email("Nieprawidłowy email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
  role: z.enum(["admin", "user"]),
  display_name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { user } = await requireAdmin();

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Nieprawidłowe dane",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, role, display_name } = parsed.data;

    const newUser = await createAllowedUser(
      email,
      password,
      role,
      display_name,
      user.id
    );

    return Response.json({ user: newUser }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nieznany błąd";
    const status = message.includes("już na liście") ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}
