"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  MessageCircle,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createProjectPreview,
  formatTaskDeadline,
  localTimestamp,
  taskStatuses,
  type ProjectTask,
} from "@/lib/initiatives/project-preview";
import type { Initiative } from "@/lib/initiatives/storage";
import { cn } from "@/lib/utils";
import { ProjectTaskSheet } from "./project-task-sheet";
import "./project-workspace.css";

export function TaskFollowUp({ task }: { task: ProjectTask }) {
  const labels = {
    confirmed: "Prazo confirmado",
    awaiting: "Aguardando resposta",
    none: "Sem contato",
    resolved: "Bloqueio resolvido",
  };
  const pending =
    task.status !== "paused" &&
    (task.attention === "decision" || task.followUp === "awaiting");
  const positive =
    task.status !== "paused" &&
    !task.attention &&
    (task.followUp === "confirmed" ||
      task.followUp === "resolved" ||
      task.status === "done");
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-auto rounded-md px-2.5 py-1 text-xs font-medium",
        pending &&
          "bg-[var(--project-pending-bg)] text-[var(--project-pending-fg)]",
        positive &&
          "bg-[var(--project-positive-bg)] text-[var(--project-positive-fg)]",
        task.status !== "paused" &&
          task.attention === "blocker" &&
          "bg-destructive/10 text-destructive",
      )}
    >
      {task.status === "paused"
        ? "Suspensa"
        : task.attention === "decision"
          ? "Decisão pendente"
          : task.attention === "blocker"
            ? "Bloqueio informado"
            : task.status === "done"
              ? "Concluída"
              : labels[task.followUp]}
    </Badge>
  );
}

function TaskTable({
  tasks,
  onOpen,
  showStatus = false,
  label = "Tarefas do projeto",
  emptyMessage = "Nenhuma tarefa encontrada.",
}: {
  tasks: ProjectTask[];
  onOpen: (id: string) => void;
  showStatus?: boolean;
  label?: string;
  emptyMessage?: string;
}) {
  return (
    <Table variant="operational" aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[38%]">Tarefa</TableHead>
          <TableHead>Executor</TableHead>
          <TableHead>Prazo</TableHead>
          {showStatus && <TableHead>Status</TableHead>}
          <TableHead>Acompanhamento</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <button
                className="flex cursor-pointer items-center gap-3 rounded-sm text-left font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(task.id)}
              >
                {task.status === "done" ? (
                  <Check className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Circle
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground",
                      task.status === "in_progress" && "text-primary",
                    )}
                  />
                )}
                {task.title}
              </button>
            </TableCell>
            <TableCell className="py-2! text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar aria-hidden="true">
                  {task.assigneeAvatarUrl && (
                    <AvatarImage src={task.assigneeAvatarUrl} alt="" />
                  )}
                  <AvatarFallback>
                    {task.assignee
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((part, index, parts) =>
                        index === 0 || index === parts.length - 1
                          ? part[0]
                          : "",
                      )
                      .join("")
                      .toLocaleUpperCase("pt-BR")}
                  </AvatarFallback>
                </Avatar>
                <span>{task.assignee}</span>
              </div>
            </TableCell>
            <TableCell className="tabular-nums text-muted-foreground">
              <time dateTime={task.dueAt}>
                {formatTaskDeadline(task.dueAt)}
              </time>
            </TableCell>
            {showStatus && (
              <TableCell className="text-muted-foreground">
                {taskStatuses[task.status]}
              </TableCell>
            )}
            <TableCell>
              <TaskFollowUp task={task} />
            </TableCell>
          </TableRow>
        ))}
        {tasks.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={showStatus ? 5 : 4}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function ProjectWorkspace({
  initiative,
  userName,
  onEdit,
}: {
  initiative: Initiative;
  userName: string;
  onEdit: () => void;
}) {
  const [tasks, setTasks] = useState(() => createProjectPreview(initiative.id));
  const [tab, setTab] = useState("attention");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<
    "details" | "criteria" | "resolve"
  >("details");
  const [creating, setCreating] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentView, setAgentView] = useState("overview");
  const [notice, setNotice] = useState("");
  const sample = initiative.id === "novo-website";
  const attention = tasks.filter(
    (task) =>
      task.attention !== null &&
      task.status !== "done" &&
      task.status !== "paused",
  );
  const tracked = tasks.filter(
    (task) =>
      task.attention === null &&
      task.status !== "done" &&
      task.status !== "paused",
  );
  const selected = tasks.find((task) => task.id === selectedId);
  const filtered = tasks.filter((task) =>
    `${task.title} ${task.assignee} ${taskStatuses[task.status]}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR")),
  );
  const activity = tasks
    .flatMap((task) =>
      task.updates.map((update) => ({
        ...update,
        taskId: task.id,
        taskTitle: task.title,
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));

  function openTask(id: string, mode: typeof detailMode = "details") {
    setDetailMode(mode);
    setSelectedId(id);
  }
  function changeTask(task: ProjectTask, message: string) {
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? task : item)),
    );
    setNotice(message);
  }

  return (
    <section className="project-workspace space-y-7">
      <AppTopbarActionsPortal>
        <Button
          variant="outline"
          className="border border-border bg-background"
          onClick={() => setAgentOpen(true)}
          aria-label="Consultar agente"
        >
          <MessageCircle className="size-4" />
          <span className="hidden sm:inline">Consultar agente</span>
        </Button>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4 sm:hidden" />
          <span className="hidden sm:inline">Nova tarefa</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </AppTopbarActionsPortal>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-heading text-[28px] leading-tight font-semibold tracking-tight">
              {initiative.title}
            </h1>
            <p className="max-w-[560px] text-sm leading-5 text-muted-foreground">
              {initiative.objective ||
                (sample
                  ? "Lançar o novo site institucional, com foco em geração de oportunidades e melhor experiência para nossos clientes."
                  : "Defina o objetivo deste projeto e organize as próximas entregas.")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar projeto"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
        <dl className="flex flex-wrap gap-6 text-sm">
          <div className="space-y-0.5 border-r pr-6">
            <dt className="text-xs text-muted-foreground">Responsável</dt>
            <dd className="font-medium">
              {initiative.owner || (sample ? "Marina Lopes" : "A definir")}
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Entrega</dt>
            <dd className="font-medium tabular-nums">
              {initiative.deadline
                ? initiative.deadline.split("-").reverse().join("/")
                : sample
                  ? "09/10/2026"
                  : "A definir"}
            </dd>
          </div>
        </dl>
      </div>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(String(value))}
        className="gap-0"
      >
        <div className="overflow-x-auto">
          <TabsList variant="selector" className="justify-start">
            {[
              ["attention", "Precisam de atenção"],
              ["tasks", "Todas as tarefas"],
              ["activity", "Atividade"],
              ["assets", "Ativos relacionados"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="attention" className="space-y-10 pt-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Situações que precisam de você
              </h2>
              <p className="text-sm text-muted-foreground">
                {attention.length
                  ? "Estas tarefas precisam da sua decisão ou ação para seguir."
                  : "Acompanhe as próximas entregas e as atualizações da equipe abaixo."}
              </p>
            </div>
            <TaskTable
              tasks={attention}
              label="Situações que precisam de você"
              emptyMessage="Nenhuma situação precisa de você."
              onOpen={(id) => {
                const task = attention.find((item) => item.id === id);
                openTask(
                  id,
                  task?.attention === "decision" ? "criteria" : "resolve",
                );
              }}
            />
          </div>
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Em produção
              </h2>
              <p className="text-sm text-muted-foreground">
                Demais tarefas do projeto que estão em execução e sendo
                acompanhadas pelo agente.
              </p>
            </div>
            <TaskTable tasks={tracked} label="Em produção" onOpen={openTask} />
            {tasks.some((task) => task.status === "paused") && (
              <p className="text-xs text-muted-foreground">
                Tarefas suspensas permanecem em Todas as tarefas e podem ser
                retomadas em Detalhes.
              </p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-5 pt-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Todas as tarefas</h2>
            <p className="text-sm text-muted-foreground">
              {tasks.length} tarefas ·{" "}
              {tasks.filter((task) => task.status === "done").length} concluídas
            </p>
          </div>
          <Input
            type="search"
            className="max-w-sm"
            aria-label="Buscar tarefas"
            placeholder="Buscar tarefa, executor ou status"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <TaskTable tasks={filtered} onOpen={openTask} showStatus />
        </TabsContent>
        <TabsContent value="activity" className="pt-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Atividade do projeto</h2>
            <p className="text-sm text-muted-foreground">
              Decisões, conversas e mudanças de prazo, com origem e responsável.
            </p>
          </div>
          <ol className="mt-4 divide-y">
            {activity.map((update) => (
              <li key={update.id} className="space-y-2 py-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {update.author}
                  </span>
                  <span>· {update.source}</span>
                  <time className="tabular-nums" dateTime={update.at}>
                    · {formatTaskDeadline(update.at)}
                  </time>
                </div>
                <button
                  className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openTask(update.taskId)}
                >
                  {update.taskTitle}
                </button>
                <p className="max-w-3xl text-sm leading-relaxed">
                  {update.text}
                </p>
                {update.delivery === "simulated" && (
                  <p className="text-xs text-muted-foreground">
                    Prévia · Não enviado
                  </p>
                )}
              </li>
            ))}
          </ol>
          {!activity.length && (
            <p className="py-10 text-sm text-muted-foreground">
              As atualizações das tarefas aparecerão aqui.
            </p>
          )}
        </TabsContent>
        <TabsContent value="assets" className="space-y-4 pt-6">
          <h2 className="text-xl font-semibold">Ativos relacionados</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Nenhum ativo vinculado a este projeto. SOPs e critérios de execução
            poderão orientar as tarefas e as respostas do agente.
          </p>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/ativos-de-gestao" />}
          >
            Explorar ativos de gestão
            <ArrowRight className="size-4" />
          </Button>
        </TabsContent>
      </Tabs>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p role="status" aria-live="polite">
          {notice}
        </p>
        <p>Dados de demonstração · Sem ferramenta conectada</p>
      </div>
      {selected && (
        <ProjectTaskSheet
          key={`${selected.id}:${detailMode}`}
          task={selected}
          mode={detailMode}
          userName={userName}
          onClose={() => setSelectedId(null)}
          onChange={changeTask}
        />
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>
              Defina a entrega e quem vai executá-la. Esta tarefa ficará nesta
              demonstração até recarregar a página.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const dueAt = String(data.get("deadline"));
              const title = String(data.get("title")).trim();
              const assignee = String(data.get("assignee")).trim();
              if (title.length < 3 || !assignee) {
                const field = event.currentTarget.elements.namedItem(
                  title.length < 3 ? "title" : "assignee",
                ) as HTMLInputElement;
                field.setCustomValidity(
                  title.length < 3
                    ? "Use pelo menos 3 caracteres no nome."
                    : "Informe o executor.",
                );
                field.reportValidity();
                return;
              }
              setTasks((current) => [
                ...current,
                {
                  id: crypto.randomUUID(),
                  title,
                  assignee,
                  dueAt,
                  originalDueAt: dueAt,
                  description: String(data.get("description")).trim(),
                  status: "todo",
                  attention: null,
                  followUp: "none",
                  criteria: [],
                  updates: [
                    {
                      id: crypto.randomUUID(),
                      author: userName,
                      text: "Tarefa criada no projeto.",
                      at: localTimestamp(),
                      source: "Projeto",
                    },
                  ],
                },
              ]);
              setCreating(false);
              setTab("tasks");
              setQuery("");
              setNotice("Tarefa criada nesta demonstração.");
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="task-title">
                Nome da tarefa
              </label>
              <Input
                id="task-title"
                name="title"
                onInput={(event) => event.currentTarget.setCustomValidity("")}
                required
                minLength={3}
                maxLength={160}
                pattern=".*\S.*"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="task-assignee">
                Executor
              </label>
              <Input
                id="task-assignee"
                name="assignee"
                onInput={(event) => event.currentTarget.setCustomValidity("")}
                required
                maxLength={120}
                pattern=".*\S.*"
                defaultValue={userName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="task-deadline">
                Prazo
              </label>
              <Input
                id="task-deadline"
                name="deadline"
                type="datetime-local"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="task-description">
                Descrição
              </label>
              <textarea
                id="task-description"
                name="description"
                rows={3}
                maxLength={1200}
                className="w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancelar
              </DialogClose>
              <Button type="submit">Criar tarefa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Sheet open={agentOpen} onOpenChange={setAgentOpen}>
        <SheetContent
          showCloseButton={false}
          className="project-workspace w-full overflow-y-auto sm:max-w-lg data-[side=right]:w-full"
        >
          <SheetHeader className="pr-14">
            <SheetTitle>Acompanhamento do projeto</SheetTitle>
            <SheetDescription>
              {initiative.title} · Prévia com dados de demonstração
            </SheetDescription>
          </SheetHeader>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3"
                aria-label="Fechar agente"
              />
            }
          >
            <X className="size-4" />
          </SheetClose>
          <div className="space-y-5 px-5 pb-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Consulte as situações identificadas neste projeto. As conversas e
              atualizações exibidas são exemplos; não há conexão com o Slack.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                ["overview", "O que precisa de mim?"],
                ["deadlines", "Como estão os prazos?"],
                ["updates", "Últimas atualizações"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={agentView === value ? "secondary" : "outline"}
                  aria-pressed={agentView === value}
                  onClick={() => setAgentView(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="space-y-4 border-t pt-5">
              <p className="text-sm font-medium">
                {agentView === "overview"
                  ? `${attention.length} situações aguardam sua intervenção.`
                  : agentView === "deadlines"
                    ? "Confirmações de prazo"
                    : "Atualizações mais recentes"}
              </p>
              {agentView === "updates"
                ? activity.slice(0, 4).map((update) => (
                    <div key={update.id} className="space-y-1 text-sm">
                      <button
                        className="text-primary hover:underline"
                        onClick={() => {
                          setAgentOpen(false);
                          openTask(update.taskId);
                        }}
                      >
                        {update.taskTitle}
                      </button>
                      <p>{update.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {update.author} · {formatTaskDeadline(update.at)}
                      </p>
                    </div>
                  ))
                : (agentView === "overview"
                    ? attention
                    : tasks.filter((task) => task.status !== "done")
                  ).map((task) => (
                    <div key={task.id} className="space-y-2 border-b pb-4">
                      <button
                        className="text-left text-sm font-medium text-primary hover:underline"
                        onClick={() => {
                          setAgentOpen(false);
                          openTask(task.id);
                        }}
                      >
                        {task.title}
                      </button>
                      <p className="text-sm text-muted-foreground">
                        {agentView === "overview"
                          ? task.description
                          : `${task.assignee} · ${formatTaskDeadline(task.dueAt)}`}
                      </p>
                      <TaskFollowUp task={task} />
                    </div>
                  ))}
              {agentView === "overview" && !attention.length && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma decisão ou bloqueio pendente neste momento.
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
