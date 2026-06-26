import { redirect } from "next/navigation";

import {
  getAccessibleOrganizationIdsForUser,
  userCanAccessModule,
} from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getPeopleOrganizationId } from "@/lib/data/pessoas-data-source";

export async function requirePeopleAccess() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  const canAccessPeople =
    session.user.role === "superadmin" ||
    (await userCanAccessModule(session.user.id, "module_people"));

  if (!canAccessPeople) {
    redirect("/docs");
  }

  const access =
    session.user.role === "superadmin"
      ? null
      : await getAccessibleOrganizationIdsForUser(session.user.id);

  return {
    organizationId:
      access?.primaryOrganizationId ?? getPeopleOrganizationId(session.user.company),
    session,
  };
}
