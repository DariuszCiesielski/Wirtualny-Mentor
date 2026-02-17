"use client";

/**
 * User Row Actions — Dropdown with role toggle and delete
 *
 * Includes AlertDialog for delete confirmation.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AllowedUser, UserRole } from "@/types/admin";

interface UserRowActionsProps {
  user: AllowedUser;
  isCurrentUser: boolean;
  onDelete: (id: string) => void;
  onRoleChange: (id: string, role: UserRole) => void;
}

export function UserRowActions({
  user,
  isCurrentUser,
  onDelete,
  onRoleChange,
}: UserRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRoleToggle = async () => {
    const newRole: UserRole = user.role === "admin" ? "user" : "admin";
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        onRoleChange(user.id, newRole);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(user.id);
        setShowDeleteDialog(false);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isCurrentUser || isLoading}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Akcje użytkownika</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRoleToggle}>
            {user.role === "admin" ? (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Degraduj do użytkownika
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Promuj na admina
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń użytkownika
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć użytkownika?</AlertDialogTitle>
            <AlertDialogDescription>
              Konto <strong>{user.email}</strong> zostanie trwale usunięte
              wraz z dostępem do platformy. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
