import { redirect } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/omdx-data-source";

export const metadata = {
  title: "Perfil — Directscal",
};

export default async function ProfilePage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  const profile = getProfileSettingsData(session.user);

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Perfil" }]} />

      <main className="flex min-w-0 flex-1 flex-col overflow-x-clip px-6 py-8 lg:px-10">
        <div className="mx-auto flex min-w-0 w-full max-w-6xl flex-col gap-6">
          <ProfileSettings profile={profile} />
        </div>
      </main>
    </>
  );
}
