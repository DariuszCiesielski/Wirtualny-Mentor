/**
 * Check Email Page (Forgot Password)
 *
 * Shown after requesting password reset.
 */

import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Sprawdź swoją skrzynkę email</CardTitle>
        <CardDescription>
          Wysłaliśmy Ci link do zresetowania hasła
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Kliknij w link w wiadomości email, aby ustawić nowe hasło. Jeżeli nie
          widzisz wiadomości, sprawdź folder spam.
        </p>
      </CardContent>

      <CardFooter className="flex-col gap-4">
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Wrócić do logowania</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
