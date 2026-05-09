import { AppTopbar } from "@/components/app-topbar";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { getProfileSettingsData } from "@/lib/data/omdx-data-source";

export const metadata = {
  title: "Perfil — Directscal",
};

export default function ProfilePage() {
  const profile = getProfileSettingsData();

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Perfil" }]} />

      <main className="flex min-w-0 flex-1 flex-col overflow-x-clip px-6 py-8 lg:px-10">
        <div className="mx-auto flex min-w-0 w-full max-w-6xl flex-col gap-6">
          <header className="min-w-0 max-w-3xl">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight">
              Perfil
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Ajuste dados básicos da conta e da empresa usados no contexto do
              módulo OMDx.
            </p>
          </header>

          <ProfileSettings profile={profile} />
        </div>
      </main>
    </>
  );
}
