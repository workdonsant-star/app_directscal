import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";

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

  const profile = await getProfileSettingsData(session.user);

  return (
    <>
      <AppTopbar />

      <AppPage className="min-w-0 overflow-x-clip">
        <div className="flex min-w-0 w-full flex-col gap-6">
          <ProfileSettings profile={profile} />
        </div>
      </AppPage>
    </>
  );
}
