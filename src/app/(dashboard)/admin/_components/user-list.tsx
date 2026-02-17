"use client";

/**
 * User List — Admin Panel
 *
 * Displays whitelist users in a table with role badges and actions.
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserRowActions } from "./user-row-actions";
import type { AllowedUser, UserRole } from "@/types/admin";

interface UserListProps {
  users: AllowedUser[];
  currentUserId: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function UserList({ users, currentUserId }: UserListProps) {
  const [optimisticUsers, setOptimisticUsers] = useState(users);

  const handleDelete = (id: string) => {
    setOptimisticUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleRoleChange = (id: string, newRole: UserRole) => {
    setOptimisticUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead className="hidden sm:table-cell">Nazwa</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Dodany</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticUsers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                Brak użytkowników na liście dostępu
              </TableCell>
            </TableRow>
          ) : (
            optimisticUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {user.display_name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                  >
                    {user.role === "admin" ? "Admin" : "Użytkownik"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={user.user_id ? "outline" : "secondary"}>
                    {user.user_id ? "Aktywny" : "Oczekuje"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell>
                  <UserRowActions
                    user={user}
                    isCurrentUser={user.user_id === currentUserId}
                    onDelete={handleDelete}
                    onRoleChange={handleRoleChange}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
