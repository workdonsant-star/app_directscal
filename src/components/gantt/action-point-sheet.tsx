"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  actionPointStageValues,
  type ActionPointCadence,
  type ActionPointEvent,
  type ActionPointSlackStatus,
  type ActionPointStageValue,
} from "@/lib/contracts";
import {
  actionPointCadenceLabels,
  actionPointStageLabels,
  formatLastInteraction,
  formatShortDate,
  type ActionPointRow,
} from "@/lib/data/action-points-list";
import {
  ActionPointPriority,
  ActionPointStageBadge,
  AssigneeAvatar,
  AssigneeCell,
  ProgressBar,
} from "./action-point-badges";
import { ActionPointTimeline } from "./action-point-timeline";
import { SlackUserPicker, type SlackUser } from "./slack-user-picker";

const stageOptions = actionPointStageValues.map((value) => ({
  value,
  label: actionPointStageLabels[value],
}));
const cadenceOptions = (
  Object.keys(actionPointCadenceLabels) as ActionPointCadence[]
).map((value) => ({ value, label: actionPointCadenceLabels[value] }));

function formatScore(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 border-t pt-5 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function ExecutionForm({
  row,
  diagnosticId,
  slackStatus,
}: {
  row: ActionPointRow;
  diagnosticId: string;
  slackStatus: ActionPointSlackStatus;
}) {
  const router = useRouter();
  const hasAssignee = row.assignee !== null;
  const [pickedUser, setPickedUser] = useState<SlackUser | null>(null);
  const [picking, setPicking] = useState(false);
  const [stage, setStage] = useState<ActionPointStageValue>(
    row.stage === "sem_responsavel" ? "atribuido" : row.stage,
  );
  const [startsOn, setStartsOn] = useState<string | null>(row.start);
  const [dueOn, setDueOn] = useState<string | null>(row.end);
  const [cadence, setCadence] = useState<ActionPointCadence>(row.cadence);
  const [progress, setProgress] = useState(row.progress);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const shownAssignee = pickedUser ?? row.assignee;

  async function send(body: Record<string, unknown>, successText: string) {
    setPending(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/action-points", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticId,
          actionPointId: row.id,
          ...body,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setFeedback({
          ok: false,
          text: payload?.message ?? "Não foi possível salvar.",
        });
        return false;
      }

      setFeedback({ ok: true, text: successText });
      router.refresh();
      return true;
    } catch {
      setFeedback({ ok: false, text: "Não foi possível salvar." });
      return false;
    } finally {
      setPending(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();

    if (!shownAssignee) {
      setFeedback({ ok: false, text: "Escolha o responsável antes de salvar." });
      return;
    }

    const saved = await send(
      {
        ...(pickedUser ? { assigneeUserId: pickedUser.userId } : {}),
        stage,
        startsOn,
        dueOn,
        cadence,
        progress,
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      "Alterações salvas.",
    );

    if (saved) {
      setPickedUser(null);
      setPicking(false);
      setNote("");
    }
  }

  async function removeAssignee() {
    const removed = await send(
      { assigneeUserId: null },
      "Responsável removido.",
    );

    if (removed) {
      setStage("atribuido");
      setPickedUser(null);
    }
  }

  return (
    <form
      onSubmit={save}
      className="space-y-4 rounded-lg border p-4"
      aria-label="Execução do action point"
    >
      <h2 className="text-sm font-semibold">Execução</h2>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Responsável</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {shownAssignee ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <AssigneeAvatar assignee={shownAssignee} />
              {shownAssignee.name}
              {pickedUser && (
                <span className="text-xs font-normal text-muted-foreground">
                  Não salvo
                </span>
              )}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Nenhuma pessoa escolhida
            </span>
          )}
          {slackStatus === "conectado" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPicking((open) => !open)}
            >
              {picking ? "Fechar lista" : shownAssignee ? "Alterar" : "Escolher"}
            </Button>
          )}
        </div>

        {slackStatus !== "conectado" && (
          <p className="text-sm text-muted-foreground">
            {slackStatus === "reconectar"
              ? "O app do Slack precisa de novas permissões para listar as pessoas. "
              : "Conecte o Slack para escolher quem executa esta ação. "}
            <Link
              href="/configuracoes"
              className="font-medium text-foreground underline underline-offset-2"
            >
              {slackStatus === "reconectar" ? "Reconectar em Configurações" : "Conectar em Configurações"}
            </Link>
          </p>
        )}

        {picking && slackStatus === "conectado" && (
          <SlackUserPicker
            selectedUserId={shownAssignee ? (pickedUser?.userId ?? row.assignee?.userId ?? null) : null}
            onSelect={(user) => {
              setPickedUser(user.userId === row.assignee?.userId ? null : user);
              setPicking(false);
            }}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label id="ap-stage-label" className="text-xs text-muted-foreground">
            Etapa
          </label>
          <Select
            value={stage}
            items={stageOptions}
            disabled={!shownAssignee}
            onValueChange={(value) => {
              if (value) setStage(value as ActionPointStageValue);
            }}
          >
            <SelectTrigger aria-labelledby="ap-stage-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label id="ap-cadence-label" className="text-xs text-muted-foreground">
            Cadência de acompanhamento
          </label>
          <Select
            value={cadence}
            items={cadenceOptions}
            disabled={!shownAssignee}
            onValueChange={(value) => {
              if (value) setCadence(value as ActionPointCadence);
            }}
          >
            <SelectTrigger aria-labelledby="ap-cadence-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cadenceOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="ap-progress"
            className="flex items-center justify-between text-xs text-muted-foreground"
          >
            Progresso
            <span className="text-sm font-medium tabular-nums text-foreground">
              {progress}%
            </span>
          </label>
          <input
            id="ap-progress"
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            disabled={!shownAssignee}
            onInput={(event) => setProgress(Number(event.currentTarget.value))}
            onChange={() => undefined}
            className="h-8 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ap-starts-on" className="text-xs text-muted-foreground">
            Início
          </label>
          <Input
            id="ap-starts-on"
            type="date"
            value={startsOn ?? ""}
            disabled={!shownAssignee}
            onInput={(event) => setStartsOn(event.currentTarget.value || null)}
            onChange={() => undefined}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ap-due-on" className="text-xs text-muted-foreground">
            Prazo
          </label>
          <Input
            id="ap-due-on"
            type="date"
            value={dueOn ?? ""}
            disabled={!shownAssignee}
            onInput={(event) => setDueOn(event.currentTarget.value || null)}
            onChange={() => undefined}
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        O agente usará a cadência para cobrar o andamento no Slack quando o
        acompanhamento ativo estiver disponível. Por enquanto ela fica
        registrada.
      </p>

      <div className="space-y-2">
        <label htmlFor="ap-note" className="text-xs text-muted-foreground">
          Nota para o histórico (opcional)
        </label>
        <textarea
          id="ap-note"
          rows={2}
          maxLength={1000}
          value={note}
          disabled={!shownAssignee}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          placeholder="Registre uma decisão ou combinado"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando" : "Salvar"}
        </Button>
        {hasAssignee && (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={removeAssignee}
          >
            Remover responsável
          </Button>
        )}
        {feedback && (
          <p
            role="status"
            aria-live="polite"
            className={
              feedback.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"
            }
          >
            {feedback.text}
          </p>
        )}
      </div>
    </form>
  );
}

export function ActionPointSheet({
  row,
  diagnosticId,
  events,
  today,
  canEdit,
  slackStatus,
  onClose,
}: {
  row: ActionPointRow;
  diagnosticId: string;
  events: ActionPointEvent[];
  today: string;
  canEdit: boolean;
  slackStatus: ActionPointSlackStatus;
  onClose: () => void;
}) {
  const { details } = row;
  const history = events.filter((event) => event.actionPointId === row.id);

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto bg-background data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-6 pr-14">
          <SheetTitle className="text-xl leading-snug">{row.title}</SheetTitle>
          <SheetDescription>
            {details.dimensionName} · {details.owner}
          </SheetDescription>
        </SheetHeader>
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              aria-label="Fechar action point"
            />
          }
        >
          <X className="size-4" />
        </SheetClose>

        <div className="space-y-6 p-6">
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Responsável</dt>
              <dd className="mt-1 font-medium">
                <AssigneeCell assignee={row.assignee} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Etapa</dt>
              <dd className="mt-1 font-medium">
                <ActionPointStageBadge stage={row.stage} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Prazo</dt>
              <dd className="mt-1 font-medium tabular-nums">
                <time dateTime={row.end}>{formatShortDate(row.end)}</time>
                {row.overdue && (
                  <span className="ml-2 text-chart-negative">Atrasado</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Progresso</dt>
              <dd className="mt-1 font-medium">
                <ProgressBar value={row.progress} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Última interação</dt>
              <dd className="mt-1 font-medium">
                {formatLastInteraction(row.lastInteractionAt, today)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Prioridade</dt>
              <dd className="mt-1 font-medium">
                <ActionPointPriority priority={details.priority} />
              </dd>
            </div>
          </dl>

          <section
            aria-labelledby="ap-history-title"
            className="space-y-3"
          >
            <h2 id="ap-history-title" className="text-sm font-semibold">
              Atividade
            </h2>
            <ActionPointTimeline events={history} />
          </section>

          {canEdit && (
            <ExecutionForm
              key={`${row.id}:${row.assignee?.userId ?? "none"}`}
              row={row}
              diagnosticId={diagnosticId}
              slackStatus={slackStatus}
            />
          )}

          <DetailSection title="Por que existe">
            <p>{details.problem}</p>
            <p className="mt-2 tabular-nums">
              A dimensão {details.dimensionName} está com nota{" "}
              {formatScore(details.score)} de 5
              {details.gap !== null
                ? `, e a distância entre as camadas é de ${formatScore(details.gap)} ponto${details.gap === 1 ? "" : "s"}`
                : ""}
              .
            </p>
          </DetailSection>

          <DetailSection title="O que fazer">
            <p>{details.recommendedAction}</p>
          </DetailSection>

          <DetailSection title="O que resolve">
            <p>{details.expectedImpact}</p>
          </DetailSection>

          <DetailSection title="Como saber que funcionou">
            <p>{details.successIndicator}</p>
          </DetailSection>

          <DetailSection title="Prazo sugerido">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs">Prazo do catálogo</dt>
                <dd className="mt-0.5 text-foreground">
                  {details.suggestedDeadline}
                </dd>
              </div>
              <div>
                <dt className="text-xs">Envolvidos</dt>
                <dd className="mt-0.5 text-foreground">
                  {details.involved.join(", ")}
                </dd>
              </div>
            </dl>
          </DetailSection>
        </div>
      </SheetContent>
    </Sheet>
  );
}
