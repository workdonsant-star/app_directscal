"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Download,
  Filter,
  MoreHorizontal,
  Search,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoleLevel = "dono" | "executor" | "apoio" | "consulta" | "vazio";
type RoleGroup = "Direção" | "Operação" | "Especialistas";

type MatrixPerson = {
  id: string;
  name: string;
  role: string;
  group: RoleGroup;
  focus: string;
  autonomy: "Alta" | "Média" | "Baixa";
  risk: string;
  responsibilities: Record<string, RoleLevel>;
};

type MatrixColumn = {
  id: string;
  label: string;
  criterion: string;
};

const columns: MatrixColumn[] = [
  {
    id: "estrategia",
    label: "Direção estratégica",
    criterion: "Decide prioridades, metas e alocação de energia.",
  },
  {
    id: "comercial",
    label: "Comercial",
    criterion: "Conduz ofertas, negociação e passagem de contexto.",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    criterion: "Garante entrada do cliente com escopo, acesso e responsáveis.",
  },
  {
    id: "entrega",
    label: "Entrega",
    criterion: "Mantém cadência, qualidade e avanço das frentes contratadas.",
  },
  {
    id: "processos",
    label: "Processos",
    criterion: "Documenta rotinas, SOPs e critérios de pronto.",
  },
  {
    id: "dados",
    label: "Dados e indicadores",
    criterion: "Organiza leitura de performance e sinais de operação.",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    criterion: "Controla cobrança, repasses, margem e previsibilidade.",
  },
  {
    id: "suporte",
    label: "Suporte ao cliente",
    criterion: "Resolve dúvidas, bloqueios e alinhamentos recorrentes.",
  },
];

const people: MatrixPerson[] = [
  {
    id: "marina",
    name: "Marina Torres",
    role: "Sócia operadora",
    group: "Direção",
    focus: "Prioridade, alçada e cadência executiva",
    autonomy: "Alta",
    risk: "Concentração de decisão em entregas críticas",
    responsibilities: {
      estrategia: "dono",
      comercial: "consulta",
      onboarding: "apoio",
      entrega: "consulta",
      processos: "consulta",
      dados: "consulta",
      financeiro: "dono",
      suporte: "vazio",
    },
  },
  {
    id: "bruno",
    name: "Bruno Almeida",
    role: "Líder de entrega PJ",
    group: "Operação",
    focus: "Rotina semanal, frentes ativas e bloqueios",
    autonomy: "Alta",
    risk: "Acúmulo entre gestão de projeto e execução direta",
    responsibilities: {
      estrategia: "apoio",
      comercial: "consulta",
      onboarding: "dono",
      entrega: "dono",
      processos: "executor",
      dados: "apoio",
      financeiro: "vazio",
      suporte: "executor",
    },
  },
  {
    id: "renata",
    name: "Renata Lima",
    role: "Especialista de processos PJ",
    group: "Especialistas",
    focus: "SOPs, documentação e critérios de pronto",
    autonomy: "Média",
    risk: "Depende de validação para publicar mudanças",
    responsibilities: {
      estrategia: "vazio",
      comercial: "vazio",
      onboarding: "apoio",
      entrega: "apoio",
      processos: "dono",
      dados: "consulta",
      financeiro: "vazio",
      suporte: "apoio",
    },
  },
  {
    id: "caio",
    name: "Caio Martins",
    role: "Analista de performance PJ",
    group: "Especialistas",
    focus: "Indicadores, leitura de dados e rotina de reporte",
    autonomy: "Média",
    risk: "Dados ficam legíveis, mas decisões ainda sobem sem critério",
    responsibilities: {
      estrategia: "consulta",
      comercial: "apoio",
      onboarding: "vazio",
      entrega: "apoio",
      processos: "consulta",
      dados: "dono",
      financeiro: "apoio",
      suporte: "vazio",
    },
  },
  {
    id: "luiza",
    name: "Luiza Prado",
    role: "Atendimento e suporte PJ",
    group: "Operação",
    focus: "Dúvidas recorrentes, handoff e satisfação",
    autonomy: "Baixa",
    risk: "Muitas respostas dependem da liderança",
    responsibilities: {
      estrategia: "vazio",
      comercial: "apoio",
      onboarding: "executor",
      entrega: "apoio",
      processos: "apoio",
      dados: "vazio",
      financeiro: "vazio",
      suporte: "dono",
    },
  },
  {
    id: "tiago",
    name: "Tiago Nunes",
    role: "Consultor comercial PJ",
    group: "Especialistas",
    focus: "Diagnóstico comercial e fechamento",
    autonomy: "Média",
    risk: "Passagem de contexto ainda informal",
    responsibilities: {
      estrategia: "consulta",
      comercial: "dono",
      onboarding: "consulta",
      entrega: "vazio",
      processos: "vazio",
      dados: "apoio",
      financeiro: "consulta",
      suporte: "vazio",
    },
  },
];

const groupOptions: Array<RoleGroup | "Todos"> = [
  "Todos",
  "Direção",
  "Operação",
  "Especialistas",
];

const roleLevelMeta: Record<
  RoleLevel,
  { label: string; shortLabel: string; className: string }
> = {
  dono: {
    label: "Dono",
    shortLabel: "D",
    className:
      "border-primary bg-[color-mix(in_oklab,var(--primary)_14%,var(--background))] text-primary",
  },
  executor: {
    label: "Executor",
    shortLabel: "E",
    className:
      "border-chart-positive bg-[color-mix(in_oklab,var(--chart-positive)_12%,var(--background))] text-chart-positive",
  },
  apoio: {
    label: "Apoio",
    shortLabel: "A",
    className:
      "border-muted-foreground/35 bg-[color-mix(in_oklab,var(--muted-foreground)_9%,var(--background))] text-foreground",
  },
  consulta: {
    label: "Consulta",
    shortLabel: "C",
    className: "border-border bg-background text-muted-foreground",
  },
  vazio: {
    label: "Sem papel definido",
    shortLabel: "",
    className: "border-transparent bg-transparent text-muted-foreground",
  },
};

const PANEL_WIDTH = "420px";
const GRID_MIN_WIDTH = "1540px";
const stickyPanelClass =
  "sticky left-0 z-30 border-r border-border/80 bg-background/96 supports-[backdrop-filter]:bg-background/92 supports-[backdrop-filter]:backdrop-blur-3xl supports-[backdrop-filter]:backdrop-saturate-150 dark:bg-background/94 dark:supports-[backdrop-filter]:bg-background/90";

function responsibilityCount(person: MatrixPerson) {
  return Object.values(person.responsibilities).filter(
    (level) => level !== "vazio",
  ).length;
}

function concentrationScore(person: MatrixPerson) {
  return Object.values(person.responsibilities).filter(
    (level) => level === "dono",
  ).length;
}

function RoleLevelMark({ level }: { level: RoleLevel }) {
  const meta = roleLevelMeta[level];

  if (level === "vazio") {
    return <span className="text-muted-foreground/45">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
        meta.className,
      )}
      title={meta.label}
    >
      {meta.shortLabel}
    </span>
  );
}

function AutonomyBadge({ value }: { value: MatrixPerson["autonomy"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 px-2 font-medium",
        value === "Alta" && "border-primary/30 text-primary",
        value === "Média" && "text-foreground",
        value === "Baixa" && "text-muted-foreground",
      )}
    >
      {value}
    </Badge>
  );
}

export function RoleMatrixWorkspace() {
  const [selectedGroup, setSelectedGroup] = useState<RoleGroup | "Todos">(
    "Todos",
  );
  const [selectedPersonId, setSelectedPersonId] = useState(people[0]?.id ?? "");

  const visiblePeople = useMemo(() => {
    return people.filter(
      (person) => selectedGroup === "Todos" || person.group === selectedGroup,
    );
  }, [selectedGroup]);

  const selectedPerson =
    people.find((person) => person.id === selectedPersonId) ?? people[0];
  const totalDefinedRoles = people.reduce(
    (sum, person) => sum + responsibilityCount(person),
    0,
  );
  const criticalOwners = people.filter(
    (person) => concentrationScore(person) >= 2,
  ).length;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="border-b px-6 py-4 lg:px-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Matriz de papéis
              </h1>
              <Badge variant="outline">Versão de teste</Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Papéis dos integrantes PJ da operação, com responsabilidades,
              autonomia e pontos que precisam de validação antes da publicação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
              {groupOptions.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "h-7 cursor-pointer rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selectedGroup === group && "bg-muted text-foreground",
                  )}
                >
                  {group}
                </button>
              ))}
            </div>
            <Button variant="outline">
              <Filter className="size-4" />
              Filtrar
            </Button>
            <Button variant="outline">
              <Download className="size-4" />
              Exportar
            </Button>
            <Button>
              <Sparkles className="size-4" />
              Gerar com IA
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Integrantes PJ</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {people.length}
            </p>
          </div>
          <div className="rounded-lg border px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Papéis preenchidos</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {totalDefinedRoles}
            </p>
          </div>
          <div className="rounded-lg border px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Concentração alta</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {criticalOwners}
            </p>
          </div>
          <div className="rounded-lg border px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="mt-1 text-sm font-medium">Rascunho gerado</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b px-6 py-3 lg:px-10">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <UserRoundCheck className="size-4 shrink-0" />
            <span className="truncate">
              {visiblePeople.length} integrantes exibidos · {columns.length} frentes de responsabilidade
            </span>
          </div>
          <div className="hidden items-center gap-1.5 lg:flex">
            {(["dono", "executor", "apoio", "consulta"] as RoleLevel[]).map(
              (level) => (
                <span
                  key={level}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <RoleLevelMark level={level} />
                  {roleLevelMeta[level].label}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <div
            className="grid min-h-full"
            style={{
              gridTemplateColumns: `${PANEL_WIDTH} repeat(${columns.length}, minmax(140px, 1fr))`,
              minWidth: GRID_MIN_WIDTH,
            }}
          >
            <div
              className={cn(
                stickyPanelClass,
                "border-b px-6 py-3 lg:pl-10",
              )}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_86px] items-end gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Integrante PJ
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Papel prático e autonomia
                  </p>
                </div>
                <p className="text-right text-xs font-medium text-muted-foreground">
                  Alçada
                </p>
              </div>
            </div>

            {columns.map((column) => (
              <div
                key={column.id}
                className="border-b border-r px-3 py-3 last:border-r-0"
              >
                <p className="text-sm font-medium leading-5">{column.label}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {column.criterion}
                </p>
              </div>
            ))}

            {visiblePeople.map((person) => {
              const isSelected = selectedPerson.id === person.id;

              return (
                <div key={person.id} className="contents">
                  <button
                    type="button"
                    onClick={() => setSelectedPersonId(person.id)}
                    className={cn(
                      stickyPanelClass,
                      "min-h-24 cursor-pointer rounded-[calc(var(--radius)*.8)] border-b px-6 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:pl-10",
                      isSelected && "bg-muted/60",
                    )}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {person.name}
                          </span>
                          <Badge variant="outline" className="shrink-0">
                            PJ
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {person.role}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {person.focus}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <AutonomyBadge value={person.autonomy} />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {responsibilityCount(person)}/{columns.length}
                        </span>
                      </div>
                    </div>
                  </button>

                  {columns.map((column) => {
                    const level = person.responsibilities[column.id] ?? "vazio";

                    return (
                      <button
                        key={`${person.id}-${column.id}`}
                        type="button"
                        onClick={() => setSelectedPersonId(person.id)}
                        className={cn(
                          "flex min-h-24 cursor-pointer items-center justify-center rounded-[calc(var(--radius)*.8)] border-b border-r px-3 transition-colors last:border-r-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isSelected && "bg-muted/30",
                        )}
                        aria-label={`${person.name}, ${column.label}: ${roleLevelMeta[level].label}`}
                      >
                        <RoleLevelMark level={level} />
                      </button>
                    );
                  })}
                </div>
              );
            })}

            <div
              className={cn(
                stickyPanelClass,
                "min-h-24 border-b px-6 py-4 lg:pl-10",
              )}
            >
              <Button variant="ghost" className="w-full justify-start">
                <Search className="size-4" />
                Revisar lacunas da matriz
              </Button>
            </div>

            {columns.map((column) => (
              <div
                key={`${column.id}-summary`}
                className="min-h-24 border-b border-r px-3 py-4 last:border-r-0"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  Donos atribuídos
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {
                    people.filter(
                      (person) => person.responsibilities[column.id] === "dono",
                    ).length
                  }
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t bg-background px-6 py-3 lg:px-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Ponto de validação: {selectedPerson.name}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {selectedPerson.risk}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <MoreHorizontal className="size-4" />
                Ajustar critérios
              </Button>
              <Button variant="outline">
                <Check className="size-4" />
                Marcar como revisado
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
