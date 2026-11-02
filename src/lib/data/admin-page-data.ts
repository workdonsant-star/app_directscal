import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminAcquisitionSnapshot } from "@/lib/data/acquisition-data-source";

export const requireAdminPageSession = cache(async () => {
  const session = await getCurrentAuthSession();
  if (!session) redirect("/entrar");
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) {
    redirect("/omdx");
  }
  return session;
});

export const getAdminPageSnapshot = cache(async () => {
  await requireAdminPageSession();
  return getAdminAcquisitionSnapshot();
});
