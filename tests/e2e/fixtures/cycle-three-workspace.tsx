"use client";

import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminRoutinesWorkspace } from "@/components/admin/routines/admin-routines-workspace";
import type { AdminRoutineWorkspace } from "@/lib/contracts/admin-adherence";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const at = "2026-10-26T12:00:00Z";
export const routineWorkspace: AdminRoutineWorkspace = {
  companyId: `company_${id(1)}`, companyName: "Empresa fictícia C3",
  actions: [{ diagnosticId: id(2), diagnosticName: "Coleta de teste", actionPointId: "ap-1", title: "Revisão semanal", description: "Conferir as entregas", successIndicator: "Ata publicada", assignment: { teamId: "T_FIXTURE", userId: "U_ORIGINAL", name: "Ana de teste", updatedAt: at } }],
  questions: [{ id: id(3), diagnosticId: id(2), text: "As entregas são revisadas?" }],
  assets: [{ id: id(4), versionId: id(5), title: "SOP fictício de revisão", version: "1" }],
  sectors: [{ id: id(6), name: "Operação" }],
  rules: [{ id: id(7), routineId: id(8), revision: 1, diagnosticId: id(2), actionPointId: "ap-1", title: "Revisão semanal", successIndicator: "Ata publicada", expectation: "Conferir as entregas", assetId: id(4), assetVersionId: id(5), questionId: id(3), sectorId: id(6), assigneeUserId: "U_ORIGINAL", schedule: { kind: "periodica", cadence: "semanal", timeZone: "America/Sao_Paulo" }, createdAt: at, reason: "Acordo inicial", actorName: "Consultora de teste" }], events: [],
};
const subscribe = () => () => {};
export function CycleThreeWorkspace() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const empty = useSearchParams().get("empty") === "1";
  return <SidebarProvider><div data-hydrated={hydrated} className="w-full min-w-0 bg-background text-foreground">
    <p className="px-10 py-3 text-xs text-muted-foreground">Fixture C3 · dados fictícios · APIs interceptadas · sem envio real</p>
    <AdminRoutinesWorkspace initial={empty ? { ...routineWorkspace, actions: [], assets: [], sectors: [], rules: [] } : routineWorkspace} checkedAt={at} />
  </div></SidebarProvider>;
}
