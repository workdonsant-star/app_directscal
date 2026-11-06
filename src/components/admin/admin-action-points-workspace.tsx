"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCompanyActionPointForm } from "@/components/admin/admin-company-action-point-form";
import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { AdminRoutineWorkspace } from "@/lib/contracts/admin-adherence";
import type { AdminCompanyActionPoint, AdminCompanyActionPointInput } from "@/lib/contracts/admin-company-action-points";
import { groupAdminActionPoints } from "@/lib/data/admin-action-points-view";
import { cn } from "@/lib/utils";

const cadenceLabels: Record<string, string> = { diaria: "Diária", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual" };
const weekdayLabels = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

type ManualWorkspace = { items: AdminCompanyActionPoint[]; assets: { id: string; title: string }[]; leaders: { userId: string; name: string; avatarUrl: string | null }[]; slackConnected: boolean };

export function AdminActionPointsWorkspace({ workspace, manual, saveManual, testManual }: { workspace: AdminRoutineWorkspace; manual: ManualWorkspace; saveManual?: (input: AdminCompanyActionPointInput) => Promise<void> | void; testManual?: (id: string) => Promise<void> | void }) {
  const groups = groupAdminActionPoints(workspace);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AdminCompanyActionPoint | "new" | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [followupError, setFollowupError] = useState<string | null>(null);
  const router = useRouter();
  const routinesHref = `/admin/empresas/${workspace.companyId}/rotinas`;
  const manualGroups = [...new Set(manual.items.map(item => item.leaderUserId))].map(userId => ({ userId, leader: manual.items.find(item => item.leaderUserId === userId)!, items: manual.items.filter(item => item.leaderUserId === userId) }));

  function toggle(key: string) {
    setOpened(current => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  async function startFollowup(actionPointId: string) {
    if (startingId) return;
    setStartingId(actionPointId); setFollowupError(null);
    try {
      if (testManual) {
        await testManual(actionPointId);
        return;
      }
      const response = await fetch(`/api/admin/companies/${workspace.companyId}/action-points`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionPointId }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Não foi possível iniciar o acompanhamento.");
      router.refresh();
    } catch (cause) { setFollowupError(cause instanceof Error ? cause.message : "Não foi possível iniciar o acompanhamento."); }
    finally { setStartingId(null); }
  }

  return <>
    <AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: workspace.companyName }]} />
    <AppPage><div className="flex w-full flex-col gap-8">
      <h1 className="text-ui-page">{workspace.companyName}</h1>
      <AdminCompanyTabs companyId={workspace.companyId} active="action-points" hasOrganization showActionPoints showReport actions={<Button type="button" onClick={() => setEditing("new")} disabled={!manual.slackConnected || manual.assets.length === 0 || manual.leaders.length === 0}><Plus aria-hidden="true" />Novo action point</Button>} />
      <section aria-label="Action points cadastrados">
        {followupError ? <p role="alert" className="mb-3 text-sm text-destructive">{followupError}</p> : null}
        {manual.items.length ? <ul className="divide-y">{manualGroups.map((group, index) => {
          const key = `manual:${group.userId}`;
          const expanded = opened.has(key);
          const name = group.leader.leaderName;
          return <li key={key}>
            <button type="button" aria-expanded={expanded} aria-controls={`admin-manual-person-${index}`} onClick={() => toggle(key)} className="flex w-full cursor-pointer items-center gap-3 rounded-md py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ChevronRight aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-[180ms] motion-reduce:transition-none", expanded && "rotate-90")} />
              <Avatar className="size-8 shrink-0"><AvatarFallback>{name.split(" ").map(part => part[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
              <span><span className="block text-sm font-medium">{name}</span><span className="block text-xs text-muted-foreground"><span className="tabular-nums">{group.items.length}</span> {group.items.length === 1 ? "action point" : "action points"}</span></span>
            </button>
            <ul id={`admin-manual-person-${index}`} hidden={!expanded} className="divide-y pb-3 pl-[72px]">{group.items.map(item => <li key={item.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0"><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.assetTitle}{item.frequency ? ` · ${cadenceLabels[item.frequency]}` : ""}{item.sendTime && item.weekdays.length ? ` · ${item.weekdays.map(day => weekdayLabels[day]).join(", ")} às ${item.sendTime} (Brasília)` : item.frequency ? " · Sem horário programado" : ""}{item.deadline ? ` · até ${new Date(`${item.deadline}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}` : ""}</p></div>
                <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={Boolean(startingId) || item.followup?.status === "preparado" || item.followup?.status === "enviando" || item.followup?.status === "incerto"} onClick={() => startFollowup(item.id)}>{startingId === item.id ? "Preparando…" : testManual ? "Simular envio agora" : "Testar envio agora"}</Button><Button type="button" size="sm" variant="outline" onClick={() => setEditing(item)}>Editar</Button></div>
              </div>
              {item.followup ? <div className="mt-2 space-y-2 text-xs text-muted-foreground"><p>{testManual ? "Envio simulado apenas nesta apresentação. Nenhuma mensagem foi enviada ao Slack." : item.followup.status === "enviado" ? "Pergunta enviada; aguardando relato ou confirmação do resumo na thread do Slack." : item.followup.status === "respondido" ? "Relato confirmado no Slack." : item.followup.status === "incerto" ? "Envio incerto; verifique a conversa no Slack antes de tentar novamente." : item.followup.status === "falhou" ? "O envio falhou; pode iniciar outro teste." : "Preparando envio."}</p>{item.followup.reports.map((report, reportIndex) => <div key={`${report.registeredAt}:${reportIndex}`} className="border-l-2 border-border pl-3"><p className="text-foreground">{report.summary}</p><p>{report.status === "duvida" ? "Dúvida registrada" : report.confirmedAt ? "Confirmado pelo líder" : "Resumo proposto; aguardando confirmação"} · {report.status.replaceAll("_", " ")} · {new Date(report.registeredAt).toLocaleString("pt-BR")}{report.evidence ? ` · Evidência citada: ${report.evidence}` : ""}</p></div>)}</div> : null}
            </li>)}</ul>
          </li>;
        })}</ul> : <p className="py-4 text-sm text-muted-foreground">Nenhum action point cadastrado para esta empresa.</p>}
        {!manual.slackConnected ? <p className="mt-2 text-sm text-muted-foreground">Conecte o Slack da empresa para escolher um líder.</p> : manual.assets.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Publique um ativo de gestão para vincular ao primeiro action point.</p> : manual.leaders.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhuma pessoa ativa foi encontrada no Slack desta empresa.</p> : null}
      </section>
      {groups.length ? <section aria-label="Action points publicados em entregas"><h2 className="mb-3 text-sm font-semibold">Publicados em entregas</h2><ul className="divide-y" aria-label="Action points por responsável">{groups.map((group, index) => {
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
      })}</ul></section> : null}
    </div></AppPage>
    <AdminCompanyActionPointForm companyId={workspace.companyId} item={editing === "new" ? null : editing} open={Boolean(editing)} assets={manual.assets} leaders={manual.leaders} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); if (!saveManual) router.refresh(); }} save={saveManual} />
  </>;
}
