"use client";

import { useState } from "react";
import { Check, TriangleAlert, X } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TaskProgressTimeline } from "./task-progress-timeline";
import { TaskDecisionPanel } from "./task-decision-panel";
import {
  formatTaskDeadline,
  localTimestamp,
  taskStatuses,
  type ProjectTask,
} from "@/lib/initiatives/project-preview";

export function ProjectTaskSheet({
  task,
  mode,
  userName,
  onClose,
  onChange,
}: {
  task: ProjectTask;
  mode: "details" | "criteria" | "resolve";
  userName: string;
  onClose: () => void;
  onChange: (task: ProjectTask, message: string) => void;
}) {
  const [status, setStatus] = useState(task.status);
  const [dueAt, setDueAt] = useState(task.dueAt);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState("progress");
  const pending =
    !!task.attention && task.status !== "done" && task.status !== "paused";
  const dirty = status !== task.status || dueAt !== task.dueAt;
  const statusOptions = Object.entries(taskStatuses).filter(
    ([value]) => !task.attention || value !== "done",
  );
  function update(
    patch: Partial<ProjectTask>,
    text: string,
    message: string,
    kind: "progress" | "decision" = "progress",
  ) {
    onChange(
      {
        ...task,
        ...patch,
        updates: [
          ...task.updates,
          {
            id: crypto.randomUUID(),
            author: userName,
            text,
            at: localTimestamp(),
            source: "Projeto",
            kind,
            action:
              kind === "decision"
                ? "registrou uma decisão"
                : "registrou uma atualização",
          },
        ],
      },
      message,
    );
    if (patch.status) setStatus(patch.status);
    if (patch.dueAt) setDueAt(patch.dueAt);
    setFeedback(message);
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="project-workspace w-full gap-0 overflow-y-auto bg-background data-[side=right]:sm:max-w-2xl data-[side=right]:w-full"
      >
        <SheetHeader className="border-b p-6 pr-14">
          <SheetTitle className="text-xl leading-snug">{task.title}</SheetTitle>
          <SheetDescription>
            {task.assignee} · {taskStatuses[task.status]}
          </SheetDescription>
        </SheetHeader>
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              aria-label="Fechar tarefa"
            />
          }
        >
          <X className="size-4" />
        </SheetClose>
        <div className="space-y-6 p-6">
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-1 font-medium">{taskStatuses[task.status]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Prazo atual</dt>
              <dd className="mt-1 tabular-nums">
                <time dateTime={task.dueAt}>
                  {formatTaskDeadline(task.dueAt)}
                </time>
              </dd>
            </div>
          </dl>
          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {feedback}
            </p>
          )}
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(String(value))}
            className="gap-5"
          >
            <div className="overflow-x-auto pb-1">
              <TabsList variant="selector">
                <TabsTrigger value="progress">Progresso</TabsTrigger>
                <TabsTrigger
                  value="decision"
                  className={cn(
                    pending &&
                      "text-destructive! data-active:bg-destructive/10! dark:data-active:bg-destructive/10!",
                  )}
                >
                  {pending && <TriangleAlert className="size-3.5" />}Tomada de
                  decisão
                </TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="progress" className="space-y-6">
              {pending && (
                <section
                  className="space-y-2 rounded-lg border border-destructive/25 bg-destructive/5 p-4"
                  aria-label="Decisão pendente"
                >
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <TriangleAlert className="size-4" />
                    Tomada de decisão necessária
                  </h2>
                  <p className="text-sm leading-relaxed">
                    {task.attention === "blocker"
                      ? task.description
                      : "A entrega aguarda sua aprovação para liberar as próximas etapas."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-1"
                    onClick={() => setTab("decision")}
                  >
                    Decidir com o agente
                  </Button>
                </section>
              )}
              <section className="space-y-5" aria-label="Progresso da tarefa">
                <h2 className="text-base font-semibold">Progresso da tarefa</h2>
                <TaskProgressTimeline updates={task.updates} />
              </section>
              <section className="border-t pt-5">
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = event.currentTarget;
                    const text = String(
                      new FormData(form).get("comment"),
                    ).trim();
                    if (!text) {
                      setFeedback("Escreva uma atualização para comentar.");
                      return;
                    }
                    update(
                      {},
                      text,
                      "Comentário adicionado nesta demonstração.",
                    );
                    form.reset();
                  }}
                >
                  <label className="text-sm font-medium" htmlFor="task-comment">
                    Adicionar atualização
                  </label>
                  <textarea
                    id="task-comment"
                    name="comment"
                    required
                    maxLength={2000}
                    rows={3}
                    className="w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Informe o progresso desta tarefa"
                  />
                  <Button variant="outline" type="submit">
                    Comentar
                  </Button>
                </form>
              </section>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Dados de demonstração. Conversas do Slack são exemplos; prévias
                de mensagens e comentários não foram enviadas.
              </p>
            </TabsContent>
            <TabsContent value="decision" className="space-y-6">
              {dirty ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Salve as alterações em Detalhes antes de preparar uma
                    decisão.
                  </p>
                  <Button variant="outline" onClick={() => setTab("details")}>
                    Voltar a Detalhes
                  </Button>
                </div>
              ) : (
                <TaskDecisionPanel
                  task={task}
                  userName={userName}
                  onChange={(next, message) => {
                    onChange(next, message);
                    setStatus(next.status);
                    setDueAt(next.dueAt);
                  }}
                  onApplied={() => {
                    setTab("progress");
                    setFeedback(
                      "Decisão registrada. Confira os registros abaixo; os envios externos são prévias.",
                    );
                  }}
                />
              )}
              {pending &&
                task.attention === "decision" &&
                task.criteria.length > 0 && (
                  <section
                    className="space-y-3 border-t pt-5"
                    aria-label="Critérios de entrega"
                  >
                    <h2 className="text-sm font-semibold">
                      Critérios de entrega
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {mode === "criteria"
                        ? "Verifique os critérios antes de aprovar esta entrega."
                        : "Confira o resultado esperado para esta tarefa."}
                    </p>
                    {task.criteria.map((criterion) => (
                      <label
                        key={criterion}
                        className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed"
                      >
                        <input
                          type="checkbox"
                          checked={criteria.includes(criterion)}
                          onChange={(event) =>
                            setCriteria(
                              event.target.checked
                                ? [...criteria, criterion]
                                : criteria.filter((item) => item !== criterion),
                            )
                          }
                          className="mt-1 size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <span>{criterion}</span>
                      </label>
                    ))}
                  </section>
                )}
              {task.attention === "decision" &&
                task.status !== "done" &&
                task.status !== "paused" && (
                  <section className="space-y-3 border-t pt-5">
                    <h2 className="text-sm font-semibold">
                      Aprovação da entrega
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      A aprovação conclui a tarefa e registra sua decisão no
                      projeto.
                    </p>
                    <Button
                      variant="outline"
                      disabled={
                        criteria.length !== task.criteria.length || dirty
                      }
                      onClick={() => {
                        update(
                          { status: "done", attention: null },
                          "Entrega aprovada após conferência dos critérios. Tarefa concluída.",
                          "Entrega aprovada. Tarefa concluída nesta demonstração.",
                          "decision",
                        );
                        setTab("progress");
                      }}
                    >
                      <Check className="size-4" />
                      Aprovar entrega
                    </Button>
                    {dirty && (
                      <p className="text-xs text-muted-foreground">
                        Salve as alterações antes de aprovar.
                      </p>
                    )}
                  </section>
                )}
              {task.attention === "blocker" &&
                task.status !== "done" &&
                task.status !== "paused" && (
                  <section className="space-y-3 border-t pt-5">
                    <h2 className="text-sm font-semibold">Resolver bloqueio</h2>
                    <p className="text-sm text-muted-foreground">
                      Registre como o acesso ou a dependência foi resolvido. A
                      tarefa volta ao acompanhamento e continua em andamento.
                    </p>
                    <form
                      className="space-y-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const text = String(
                          new FormData(event.currentTarget).get("resolution"),
                        ).trim();
                        if (text.length < 3) {
                          setFeedback(
                            "Descreva a resolução com pelo menos 3 caracteres.",
                          );
                          return;
                        }
                        update(
                          {
                            attention: null,
                            status: "in_progress",
                            followUp: "resolved",
                          },
                          `Bloqueio resolvido: ${text}`,
                          "Bloqueio resolvido. Tarefa em acompanhamento.",
                          "decision",
                        );
                        setTab("progress");
                      }}
                    >
                      <label className="sr-only" htmlFor="blocker-resolution">
                        Como o bloqueio foi resolvido?
                      </label>
                      <textarea
                        id="blocker-resolution"
                        name="resolution"
                        required
                        minLength={3}
                        maxLength={1200}
                        rows={3}
                        placeholder="Como o bloqueio foi resolvido?"
                        className="w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button type="submit" variant="outline" disabled={dirty}>
                        Registrar resolução
                      </Button>
                      {dirty && (
                        <p className="text-xs text-muted-foreground">
                          Salve as alterações antes de registrar a resolução.
                        </p>
                      )}
                    </form>
                  </section>
                )}
            </TabsContent>
            <TabsContent value="details" className="space-y-6">
              {task.criteria.length > 0 && (
                <section className="space-y-3" aria-label="Resultado esperado">
                  <h2 className="text-sm font-semibold">
                    Critérios de entrega
                  </h2>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {task.criteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="text-sm leading-relaxed">
                {task.description || "Nenhuma descrição adicionada."}
              </p>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const deadlineChanged = dueAt !== task.dueAt;
                  const text = [
                    status !== task.status
                      ? `Status alterado para ${taskStatuses[status]}.`
                      : "",
                    deadlineChanged
                      ? `Prazo ajustado de ${formatTaskDeadline(task.dueAt)} para ${formatTaskDeadline(dueAt)}.`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  if (!text) return;
                  update(
                    {
                      status,
                      dueAt,
                      ...(deadlineChanged || status === "paused"
                        ? { followUp: "none" as const }
                        : {}),
                      ...(status === "done" ? { attention: null } : {}),
                    },
                    text,
                    "Alterações salvas nesta demonstração.",
                  );
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      id="task-status-label"
                      className="text-sm font-medium"
                    >
                      Status
                    </label>
                    <Select
                      value={status}
                      items={statusOptions.map(([value, label]) => ({
                        value,
                        label,
                      }))}
                      onValueChange={(value) => {
                        if (value && value in taskStatuses)
                          setStatus(value as ProjectTask["status"]);
                      }}
                    >
                      <SelectTrigger
                        aria-labelledby="task-status-label"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="task-detail-deadline"
                      className="text-sm font-medium"
                    >
                      Prazo atual
                    </label>
                    <Input
                      id="task-detail-deadline"
                      type="datetime-local"
                      required
                      value={dueAt}
                      onInput={(event) => setDueAt(event.currentTarget.value)}
                    />
                  </div>
                </div>
                {task.originalDueAt !== task.dueAt && (
                  <p className="text-xs text-muted-foreground">
                    Prazo original: {formatTaskDeadline(task.originalDueAt)}. O
                    histórico de ajustes está preservado em Progresso.
                  </p>
                )}
                {dirty && <Button type="submit">Salvar alterações</Button>}
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
