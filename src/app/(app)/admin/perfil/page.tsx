import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { AdminProfileSettings } from "@/components/profile/admin-profile-settings";
import { getCurrentAuthSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Perfil — Admin Directscal" };

export default async function AdminProfilePage() {
  const session = await getCurrentAuthSession();
  if (!session) redirect("/entrar");
  if (session.user.role !== "superadmin") redirect("/omdx");

  return (
    <>
      <AppTopbar />
      <AppPage className="min-w-0 overflow-x-clip">
        <AdminProfileSettings
          key={session.user.id}
          profile={{
            name: session.user.name,
            email: session.user.email,
            avatarUrl: session.user.avatarUrl ?? null,
          }}
        />
      </AppPage>
    </>
  );
}
