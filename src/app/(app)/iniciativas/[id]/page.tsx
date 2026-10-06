import { InitiativeProjectPage } from "@/components/initiatives/initiative-project-page";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";

export const metadata = { title: "Projeto — Directscal" };

export default async function InitiativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getCurrentAppAccessContext();
  if (!context) return null;
  return (
    <InitiativeProjectPage
      id={id}
      scope={`${context.session.user.id}:${context.access?.primaryOrganizationId ?? "local"}`}
      userName={context.session.user.name ?? "Você"}
    />
  );
}
