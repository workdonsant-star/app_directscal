import { NextResponse } from "next/server";

import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { actionPointUpdateInputSchema } from "@/lib/contracts";
import { planActionPointUpdate } from "@/lib/data/action-point-execution";
import {
  getActionPointExecution,
  saveActionPointUpdate,
} from "@/lib/data/action-point-execution-data-source";
import { defaultCadence } from "@/lib/data/action-points-list";
import { getPublishedActionPointsWorkspace } from "@/lib/data/published-action-points";
import {
  getSlackBotTokenForOrganization,
  getSlackWorkspaceUser,
} from "@/lib/integrations/slack";

function fail(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function PATCH(request: Request) {
  const session = await getCurrentAuthSession();

  if (!session) return fail("Entre para continuar.", 401);

  if (!canManageOrganization(session.user)) {
    return fail(
      "Apenas o Superadmin da empresa pode alterar os action points.",
      403,
    );
  }

  const parsed = actionPointUpdateInputSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) return fail("Revise os dados informados.", 400);

  const input = parsed.data;
  const { workspace, organizationId } = await getPublishedActionPointsWorkspace();
  const task = workspace.tasks
    .flatMap((root) => root.subitems ?? [])
    .find((item) => item.id === input.actionPointId);

  // Só ações da entrega publicada, dos diagnósticos que a sessão enxerga.
  if (
    !organizationId ||
    !task?.actionPoint ||
    workspace.source?.diagnosticId !== input.diagnosticId
  ) {
    return fail("Action point não encontrado.", 404);
  }

  try {
    const { assignments } = await getActionPointExecution({
      diagnosticId: input.diagnosticId,
      organizationId,
    });
    const existing =
      assignments.find((item) => item.actionPointId === input.actionPointId) ??
      null;
    let assignee = null;

    if (typeof input.assigneeUserId === "string") {
      if (existing?.assignee.userId === input.assigneeUserId) {
        assignee = existing.assignee;
      } else {
        const installation = await getSlackBotTokenForOrganization(organizationId);

        if (!installation) {
          return fail("Conecte o Slack em Configurações para escolher responsáveis.", 409);
        }

        const user = await getSlackWorkspaceUser(
          installation.botToken,
          input.assigneeUserId,
        ).catch(() => {
          throw new SlackLookupError();
        });

        if (!user) return fail("Essa pessoa não está disponível no Slack.", 400);

        assignee = {
          teamId: installation.teamId,
          userId: user.userId,
          name: user.name,
          avatarUrl: user.avatarUrl,
        };
      }
    }

    const plan = planActionPointUpdate({
      existing,
      input,
      assignee,
      defaults: {
        startsOn: task.start,
        dueOn: task.end,
        cadence: defaultCadence(task.actionPoint.priority),
      },
    });

    if (!plan.ok) return fail(plan.message, 400);

    await saveActionPointUpdate({
      diagnosticId: input.diagnosticId,
      organizationId,
      actionPointId: input.actionPointId,
      authorName: session.user.name,
      plan,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SlackLookupError) {
      return fail(
        "Não foi possível consultar o Slack. Reconecte o app em Configurações e tente de novo.",
        502,
      );
    }

    console.error("[action-points] update failed", error);
    return fail("Não foi possível salvar o action point.", 500);
  }
}

class SlackLookupError extends Error {}
