import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { AdminRoutinesWorkspace } from "@/components/admin/routines/admin-routines-workspace";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminRoutineWorkspace } from "@/lib/data/admin-adherence-data-source";
import { getRoutineContactPolicy } from "@/lib/data/routine-contact-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
import { getRoutineResultBaselines } from "@/lib/data/routine-results-data-source";
import { getRoutineSupervision } from "@/lib/data/routine-supervision-data-source";

export const metadata: Metadata = { title: "Rotinas — Admin Directscal" };
export default async function AdminRoutinesPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const session = await getCurrentAuthSession();
  if (!session || session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) redirect("/entrar");
  const { id } = await params;
  const [workspace, policy, review, baselines] = await Promise.all([getAdminRoutineWorkspace(id, session.user.id), getRoutineContactPolicy(id, session.user.id), getRoutineSupervision(id, session.user.id), getRoutineResultBaselines(id)]).catch(error => {
    if (error instanceof AssetAdherenceError && error.status === 404) notFound();
    throw error;
  });
  return <AdminRoutinesWorkspace initial={workspace} initialPolicy={policy} initialReview={review} initialBaselines={baselines} checkedAt={new Date().toISOString()} />;
}
