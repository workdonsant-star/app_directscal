"use client";

import { AdminActionPointsWorkspace } from "@/components/admin/admin-action-points-workspace";
import type { AdminCompanyActionPointInput } from "@/lib/contracts/admin-company-action-points";
import { getDemoAdminAssets } from "@/lib/data/demo/demo-admin-assets";
import { demoRoutineUsers, demoRoutineWorkspace } from "@/lib/data/demo/demo-admin-routines";
import { DEMO_DATE } from "@/lib/data/demo/demo-data";
import type { DemoActionPoint, DemoState } from "@/lib/data/demo/demo-state";
import { updateDemo, useDemo } from "./demo-store";

function seedActionPoints(state: DemoState): DemoActionPoint[] {
  const [first, second] = getDemoAdminAssets(state);
  if (!first || !second) return [];
  return [
    { id: "demo-ap-1", title: "Sustentar o ritual semanal de prioridades", assetId: first.id, leaderUserId: demoRoutineUsers[0]?.userId ?? "", deadline: null, frequency: "semanal", weekdays: [1], sendTime: "09:00", scheduleStartsOn: "2026-11-02", reason: "Comunicação teve a maior divergência entre camadas: a operação não reconhece as prioridades definidas pela liderança.", action: "Conduzir o ritual toda segunda e registrar prioridades e impedimentos no canal da área.", continuity: `${first.title} define pauta, participantes e registro. O agente usa esse padrão para acompanhar o ritual no Slack.` },
    { id: "demo-ap-2", title: "Aplicar o padrão de resultados semanais", assetId: second.id, leaderUserId: demoRoutineUsers[1]?.userId ?? "", deadline: "2026-11-30", frequency: "semanal", weekdays: [5], sendTime: "16:00", scheduleStartsOn: "2026-11-02", reason: "Performance tem indicadores sem dono e revisões sem regularidade.", action: "Atualizar os resultados da semana e registrar desvios com a causa.", continuity: `${second.title} é a referência única do acompanhamento. Desvios recorrentes indicam que ele precisa de revisão.` },
  ];
}

export function DemoAdminActionPoints() {
  const { state } = useDemo();
  const assets = getDemoAdminAssets(state).filter(asset => !asset.archivedAt && asset.status === "publicado");
  const points = state.adminActionPoints ?? seedActionPoints(state);
  const manual = {
    items: points.map(point => {
      const leader = demoRoutineUsers.find(user => user.userId === point.leaderUserId);
      return {
        ...point,
        assetTitle: assets.find(asset => asset.id === point.assetId)?.title ?? "Ativo indisponível",
        leaderName: leader?.name ?? "Sem líder",
        leaderAvatarUrl: leader?.avatarUrl ?? null,
        updatedAt: DEMO_DATE,
        followup: state.adminTestedActionPoints?.includes(point.id) ? { id: `demo-followup-${point.id}`, status: "enviado" as const, createdAt: DEMO_DATE, reports: [] } : null,
      };
    }),
    assets: assets.map(asset => ({ id: asset.id, title: asset.title })),
    leaders: demoRoutineUsers.map(user => ({ userId: user.userId, name: user.name, avatarUrl: user.avatarUrl ?? null })),
    slackConnected: state.slackConnected,
  };

  function saveManual(input: AdminCompanyActionPointInput) {
    const item: DemoActionPoint = {
      id: input.id, title: input.title, assetId: input.assetId, leaderUserId: input.leaderUserId,
      deadline: input.deadline, frequency: input.frequency, weekdays: input.weekdays,
      sendTime: input.sendTime, scheduleStartsOn: input.scheduleStartsOn,
      reason: input.reason, action: input.action, continuity: input.continuity,
    };
    updateDemo(current => {
      const list = current.adminActionPoints ?? seedActionPoints(current);
      return { ...current, adminActionPoints: list.some(entry => entry.id === item.id) ? list.map(entry => entry.id === item.id ? item : entry) : [...list, item] };
    });
  }

  function testManual(id: string) {
    updateDemo(current => ({ ...current, adminTestedActionPoints: [...new Set([...(current.adminTestedActionPoints ?? []), id])] }));
  }

  return <AdminActionPointsWorkspace workspace={demoRoutineWorkspace(state)} manual={manual} saveManual={saveManual} testManual={testManual} />;
}
