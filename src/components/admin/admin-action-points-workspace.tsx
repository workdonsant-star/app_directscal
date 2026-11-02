"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { AdminRoutineWorkspace } from "@/lib/contracts/admin-adherence";
import { groupAdminActionPoints } from "@/lib/data/admin-action-points-view";
import { cn } from "@/lib/utils";

const cadenceLabels: Record<string, string> = { diaria: "Diária", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual" };

export function AdminActionPointsWorkspace({ workspace }: { workspace: AdminRoutineWorkspace }) {
  const groups = groupAdminActionPoints(workspace);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const routinesHref = `/admin/empresas/${workspace.companyId}/rotinas`;

  function toggle(key: string) {
    setOpened(current => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  return <>
    <AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: workspace.companyName }]} />
    <AppPage><div className="flex w-full flex-col gap-8">
      <h1 className="text-ui-page">{workspace.companyName}</h1>
      <AdminCompanyTabs companyId={workspace.companyId} active="action-points" hasOrganization showActionPoints />
      {groups.length ? <ul className="divide-y" aria-label="Action points por responsável">{groups.map((group, index) => {
        const expanded = opened.has(group.key);
        const initials = group.name === "Sem responsável" ? "?" : group.name.split(" ").map(part => part[0]).slice(0, 2).join("");
        return <li key={group.key}>
          <button type="button" aria-expanded={expanded} aria-controls={`admin-action-person-${index}`} onClick={() => toggle(group.key)} className="flex w-full cursor-pointer items-center gap-3 rounded-md py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronRight aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-[180ms] motion-reduce:transition-none", expanded && "rotate-90")} />
            <Avatar className="size-8 shrink-0"><AvatarFallback>{initials}</AvatarFallback></Avatar>
            <span><span className="block text-sm font-medium">{group.name}</span><span className="block text-xs text-muted-foreground"><span className="tabular-nums">{group.actions.length}</span> {group.actions.length === 1 ? "action point" : "action points"}</span></span>
          </button>
          <ul id={`admin-action-person-${index}`} hidden={!expanded} className="divide-y pb-3 pl-[72px]">{group.actions.map(action => <li key={`${action.diagnosticId}:${action.actionPointId}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0"><p className="text-sm font-medium">{action.title}</p><p className="text-xs text-muted-foreground">{action.routines.length === 1 ? `${action.routines[0].assetTitle ?? "Ativo indisponível"}${action.routines[0].rule.schedule.kind === "periodica" ? ` · ${cadenceLabels[action.routines[0].rule.schedule.cadence] ?? action.routines[0].rule.schedule.cadence}` : ""}` : action.routines.length > 1 ? `${action.routines.length} rotinas` : action.diagnosticName}</p></div>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={routinesHref} />}>{action.routines.length ? "Ver rotinas" : "Configurar rotina"}</Button>
          </li>)}</ul>
        </li>;
      })}</ul> : <p className="py-4 text-sm text-muted-foreground">Nenhum action point publicado para esta empresa.</p>}
    </div></AppPage>
  </>;
}
