import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { AdminActionPointsWorkspace } from "@/components/admin/admin-action-points-workspace";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminRoutineWorkspace } from "@/lib/data/admin-adherence-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";

export const metadata: Metadata = { title: "Action Points — Admin Directscal" };

export default async function AdminActionPointsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const session = await getCurrentAuthSession();
  if (!session || session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) redirect("/entrar");
  const { id } = await params;
  const workspace = await getAdminRoutineWorkspace(id, session.user.id).catch(error => {
    if (error instanceof AssetAdherenceError && error.status === 404) notFound();
    throw error;
  });
  return <AdminActionPointsWorkspace workspace={workspace} />;
}
