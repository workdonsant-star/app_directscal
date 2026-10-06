"use client";

import { useState } from "react";
import { MessageCircle, Send, TriangleAlert } from "lucide-react";
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
  applyPreviewDecision,
  decisionActions,
  prepareDecision,
  type DecisionInput,
  type DecisionPlan,
} from "@/lib/initiatives/project-decisions";
import {
  localTimestamp,
  type ProjectTask,
} from "@/lib/initiatives/project-preview";

export function TaskDecisionPanel({
  task,
  userName,
  onChange,
  onApplied,
}: {
  task: ProjectTask;
  userName: string;
  onChange: (task: ProjectTask, message: string) => void;
  onApplied: () => void;
}) {
  const [action, setAction] = useState<DecisionInput["action"]>("guidance");
  const [instruction, setInstruction] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [plan, setPlan] = useState<DecisionPlan | null>(null);
  const [error, setError] = useState("");
  const unavailable = task.status === "done" || task.status === "paused";
  return (
    <section className="space-y-5" aria-label="Conversa de decisão">
      <div className="space-y-2 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <TriangleAlert className="size-4" />
          {task.attention === "blocker"
            ? "Impedimento informado"
            : "Decisão do líder"}
        </h2>
        <p className="text-sm leading-relaxed">
          {task.attention === "blocker"
            ? task.description
            : task.attention === "decision"
              ? "A entrega está em revisão. Sua aprovação libera as próximas etapas do projeto."
              : "Use o progresso registrado para orientar o próximo passo desta tarefa."}
        </p>
        <p className="text-xs text-muted-foreground">
          {task.attention === "blocker"
            ? "Defina o próximo passo. O bloqueio permanece até a resolução ser registrada."
            : "Você pode aprovar a entrega após conferir os critérios ou orientar o executor."}
        </p>
      </div>
      {unavailable ? (
        <p className="text-sm text-muted-foreground">
          {task.status === "paused"
            ? "Tarefa suspensa. Retome a execução em Detalhes para registrar uma nova orientação."
            : "Tarefa concluída. As decisões permanecem no progresso."}
        </p>
      ) : !plan ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              setPlan(
                prepareDecision(task, { action, instruction, dueAt }, userName),
              );
              setError("");
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Revise sua orientação.",
              );
            }
          }}
        >
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Agente</span>
              <br />
              Qual decisão você quer registrar? Vou preparar o comentário no
              card e a mensagem para {task.assignee}.
            </p>
          </div>
          <div className="space-y-2">
            <label id="decision-action-label" className="text-sm font-medium">
              Próximo passo
            </label>
            <Select
              value={action}
              items={Object.entries(decisionActions).map(([value, label]) => ({
                value,
                label,
              }))}
              onValueChange={(value) => {
                if (value && value in decisionActions) {
                  setAction(value as DecisionInput["action"]);
                  setError("");
                }
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-labelledby="decision-action-label"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(decisionActions).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {action === "postpone" && (
            <div className="space-y-2">
              <label
                htmlFor="decision-deadline"
                className="text-sm font-medium"
              >
                Novo prazo
              </label>
              <Input
                id="decision-deadline"
                type="datetime-local"
                required
                min={task.dueAt}
                value={dueAt}
                onInput={(event) => setDueAt(event.currentTarget.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="leader-instruction" className="text-sm font-medium">
              Sua orientação para o agente
            </label>
            <textarea
              id="leader-instruction"
              rows={3}
              required
              minLength={3}
              maxLength={1200}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="Explique o que deve acontecer e por quê. Ex.: vamos fazer uma call para destravar o acesso."
              className="w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" variant="outline">
            <Send className="size-4" />
            Preparar decisão
          </Button>
        </form>
      ) : (
        <div className="space-y-5" aria-live="polite">
          <div className="space-y-1 border-b pb-4">
            <p className="text-xs font-medium text-muted-foreground">
              {userName}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {plan.input.instruction}
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              Agente · Revise antes de confirmar
            </h3>
            <p className="text-sm leading-relaxed">{plan.effect}</p>
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground">
                Comentário no card · Prévia
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {plan.cardComment}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground">
                Mensagem no Slack · Prévia
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {plan.executorMessage}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                try {
                  onChange(
                    applyPreviewDecision(
                      task,
                      plan,
                      userName,
                      localTimestamp(),
                      crypto.randomUUID(),
                    ),
                    "Decisão registrada na demonstração. Comentário e mensagem preparados, sem envio externo.",
                  );
                  onApplied();
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Não foi possível registrar a decisão.",
                  );
                }
              }}
            >
              Confirmar decisão
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPlan(null);
                setError("");
              }}
            >
              Editar orientação
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
        Demonstração: a resposta é preparada a partir da ação escolhida. Nenhum
        comentário externo ou mensagem é enviado.
      </p>
    </section>
  );
}
