/**
 * Unauthorized Page
 *
 * Shown when an authenticated user is not on the whitelist.
 */

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mb-2 flex justify-center">
          <ShieldX className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">Brak dostępu</CardTitle>
        <CardDescription>
          Twoje konto nie ma uprawnień do korzystania z platformy. Skontaktuj
          się z administratorem, aby uzyskać dostęp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Powróć do logowania</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
