/**
 * Sign Up Page — Disabled (Whitelist Mode)
 *
 * Self-registration is disabled. Only admins can create accounts.
 */

import Link from "next/link";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mb-2 flex justify-center">
          <UserX className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">Rejestracja niedostępna</CardTitle>
        <CardDescription>
          Konta są tworzone wyłącznie przez administratora platformy.
          Skontaktuj się z administratorem, aby uzyskać dostęp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/login">Przejdź do logowania</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
