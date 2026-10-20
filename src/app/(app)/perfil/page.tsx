import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { getSlackIdentityStatus } from "@/lib/data/slack-identity-data-source";
import { hasCustomerPassword } from "@/lib/auth/password-recovery";

export const metadata = {
  title: "Perfil — Directscal",
};

export default async function ProfilePage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(session.user)) {
    redirect("/admin/operacao");
  }

  const [profile, slackIdentity, passwordEnabled] = await Promise.all([
    getProfileSettingsData(session.user),
    session.supabaseAccessToken && !session.acquisition && !session.leadershipInvitation ? getSlackIdentityStatus(session) : Promise.resolve(null),
    session.supabaseAccessToken && !session.acquisition && !session.leadershipInvitation ? hasCustomerPassword(session) : Promise.resolve(false),
  ]);

  return (
    <>
      <AppTopbar />

      <AppPage className="min-w-0 overflow-x-clip">
        <div className="flex min-w-0 w-full flex-col gap-6">
          <ProfileSettings key={profile.id} profile={profile} slackIdentity={slackIdentity} passwordEnabled={passwordEnabled} />
        </div>
      </AppPage>
    </>
  );
}
