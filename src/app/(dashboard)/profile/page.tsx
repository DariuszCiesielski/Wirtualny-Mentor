/**
 * Profile Page
 *
 * Allows user to edit their profile information and avatar.
 */

import { getUser } from "@/lib/dal/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { BusinessProfileForm } from "@/components/onboarding/business-profile-form";
import { getBusinessProfile } from "@/lib/onboarding/onboarding-dal";

function getInitials(name: string | undefined, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    return null; // Layout will redirect
  }

  const fullName = user.user_metadata?.full_name as string | undefined;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const initials = getInitials(fullName, user.email || "U");
  const businessProfile = await getBusinessProfile();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Twój profil</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj swoimi danymi osobowymi
        </p>
      </div>

      {/* Avatar section */}
      <Card>
        <CardHeader>
          <CardTitle>Zdjęcie profilowe</CardTitle>
          <CardDescription>
            Wybierz zdjęcie, które będzie widoczne w aplikacji
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload currentAvatarUrl={avatarUrl} initials={initials} />
        </CardContent>
      </Card>

      {/* Profile info section */}
      <Card>
        <CardHeader>
          <CardTitle>Dane osobowe</CardTitle>
          <CardDescription>Zaktualizuj swoje imię wyświetlane w aplikacji</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialName={fullName || ""} />
        </CardContent>
      </Card>

      {/* Email info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Adres email</CardTitle>
          <CardDescription>
            Adres email używany do logowania (nie można zmienić)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </CardContent>
      </Card>

      <Separator />

      {/* Business profile section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profil biznesowy</h2>
        <p className="text-muted-foreground mt-2">
          Informacje o Twoim biznesie pomagają nam dostosować kursy i sugestie
        </p>
      </div>

      <BusinessProfileForm initialData={businessProfile} />
    </div>
  );
}
