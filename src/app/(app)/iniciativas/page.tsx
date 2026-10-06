import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { InitiativesWorkspace } from "@/components/initiatives/initiatives-workspace";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";
export const metadata = { title: "Iniciativas — Directscal" };
export default async function InitiativesPage() {
  const context = await getCurrentAppAccessContext();
  if (!context) return null;
  return (
    <>
      <AppTopbar />
      <AppPage>
        <InitiativesWorkspace
          scope={`${context.session.user.id}:${context.access?.primaryOrganizationId ?? "local"}`}
        />
      </AppPage>
    </>
  );
}
