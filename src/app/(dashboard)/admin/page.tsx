/**
 * Admin Page — User Management
 *
 * Server Component that verifies admin role and fetches user list.
 * Protected by requireAdmin() — redirects non-admins to /unauthorized.
 */

import { requireAdmin } from "@/lib/dal/auth";
import { listAllowedUsers } from "@/lib/dal/admin-users";
import { UserList } from "./_components/user-list";
import { UserFormDialog } from "./_components/user-form-dialog";
import { ShieldCheck } from "lucide-react";

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const users = await listAllowedUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Zarządzanie użytkownikami
            </h1>
            <p className="text-sm text-muted-foreground">
              {users.length}{" "}
              {users.length === 1
                ? "użytkownik"
                : users.length < 5
                  ? "użytkowników"
                  : "użytkowników"}{" "}
              na liście dostępu
            </p>
          </div>
        </div>
        <UserFormDialog />
      </div>

      <UserList users={users} currentUserId={user.id} />
    </div>
  );
}
