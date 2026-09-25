"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  LockKeyhole,
  Save,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type {
  AuthRole,
  Diagnostic,
  DiagnosticTemplate,
  OrganizationSector,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type DiagnosticFormProps = {
  mode: "create" | "edit";
  diagnostic?: Diagnostic;
  currentUserEmail: string;
  currentUserRole: AuthRole;
  organizationName: string;
  sectors: OrganizationSector[];
  template: DiagnosticTemplate;
  onSaveDraft: (form: DiagnosticFormState) => void;
  onActivate: (form: DiagnosticFormState) => void;
  onCancel: () => void;
};

export type DiagnosticFormState = {
  name: string;
  description: string;
  deadline: string;
  leaderIds: string[];
};

type FormErrors = Partial<Record<"name" | "leaders", string>>;
type Step = 1 | 2 | 3;

const steps: Array<{ id: Step; label: string }> = [
  { id: 1, label: "Informações" },
  { id: 2, label: "Lideranças responsáveis" },
  { id: 3, label: "Revisão" },
];

function getInitialFormState({
  currentUserEmail,
  currentUserRole,
  diagnostic,
  sectors,
}: {
  currentUserEmail: string;
  currentUserRole: AuthRole;
  diagnostic?: Diagnostic;
  sectors: OrganizationSector[];
}): DiagnosticFormState {
  const configuredLeaderIds = diagnostic?.sectors?.flatMap(
    (sector) => sector.leaderIds,
  );
  const ownLeaderId = sectors.find(
    (sector) =>
      sector.inviteStatus === "ativo" &&
      sector.leader.email.toLowerCase() === currentUserEmail.toLowerCase(),
  )?.leader.id;

  return {
    name: diagnostic?.name ?? "",
    description: diagnostic?.description ?? "",
    deadline: diagnostic?.deadline ?? "",
    leaderIds:
      configuredLeaderIds && configuredLeaderIds.length > 0
        ? [...new Set(configuredLeaderIds)]
        : currentUserRole === "admin" && ownLeaderId
          ? [ownLeaderId]
          : [],
  };
}

function formatDeadline(deadline: string) {
  if (!deadline) return "Sem prazo definido";

  const [year, month, day] = deadline.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email.split("@")[0] || "L";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DiagnosticForm({
  currentUserEmail,
  currentUserRole,
  diagnostic,
  organizationName,
  sectors,
  template,
  onSaveDraft,
  onActivate,
  onCancel,
}: DiagnosticFormProps) {
  const [form, setForm] = useState<DiagnosticFormState>(() =>
    getInitialFormState({ currentUserEmail, currentUserRole, diagnostic, sectors }),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState("");

  const activeSectors = sectors.filter(
    (sector) => sector.active && sector.inviteStatus === "ativo",
  );
  const visibleSectors = sectors.filter((sector) => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedQuery) return true;

    return [
      sector.name,
      sector.leader.name ?? "",
      sector.leader.email,
      sector.leader.position,
    ].some((value) =>
      value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
    );
  });
  const selectedSectors = sectors.filter((sector) =>
    form.leaderIds.includes(sector.leader.id),
  );

  function updateField(
    field: "name" | "description" | "deadline",
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "name") {
      setErrors((current) => ({ ...current, name: undefined }));
    }
  }

  function toggleLeader(leaderId: string) {
    setForm((current) => ({
      ...current,
      leaderIds: current.leaderIds.includes(leaderId)
        ? current.leaderIds.filter((id) => id !== leaderId)
        : [...current.leaderIds, leaderId],
    }));
    setErrors((current) => ({ ...current, leaders: undefined }));
  }

  function validateBasics() {
    if (form.name.trim()) return true;
    setErrors((current) => ({
      ...current,
      name: "Informe o nome do diagnóstico.",
    }));
    setStep(1);
    return false;
  }

  function validateLeaders() {
    if (form.leaderIds.length > 0) return true;
    setErrors((current) => ({
      ...current,
      leaders: "Selecione ao menos uma liderança responsável.",
    }));
    setStep(2);
    return false;
  }

  function handleNext() {
    if (step === 1 && !validateBasics()) return;
    if (step === 2 && !validateLeaders()) return;
    setStep((current) => Math.min(3, current + 1) as Step);
  }

  function handleSaveDraft() {
    if (!validateBasics()) return;
    onSaveDraft(form);
  }

  function handleActivate() {
    if (!validateBasics() || !validateLeaders()) return;
    onActivate(form);
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => event.preventDefault()}
    >
      <nav
        aria-label="Etapas da criação do diagnóstico"
        className="shrink-0 border-b px-4 py-3 sm:px-6"
      >
        <ol className="grid grid-cols-3 gap-2">
          {steps.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  step === item.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setStep(item.id)}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums",
                    step > item.id &&
                      "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {step > item.id ? <Check className="size-3" /> : item.id}
                </span>
                <span className="hidden truncate sm:block">{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {step === 1 && (
          <section
            aria-labelledby="diagnostic-details-title"
            className="flex flex-col gap-6 p-4 sm:p-6"
          >
            <div className="flex flex-col gap-1">
              <h3
                id="diagnostic-details-title"
                className="text-base font-semibold text-foreground"
              >
                Informações da coleta
              </h3>
              <p className="max-w-[65ch] text-sm text-muted-foreground">
                Identifique o ciclo e defina até quando as respostas serão
                recebidas.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="diagnostic-name"
                  className="text-sm font-medium text-foreground"
                >
                  Nome do diagnóstico
                </label>
                <Input
                  id="diagnostic-name"
                  value={form.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "diagnostic-name-error" : undefined
                  }
                  placeholder="Ex.: Maturidade - Q3 2026"
                  onChange={(event) => updateField("name", event.target.value)}
                />
                {errors.name && (
                  <p id="diagnostic-name-error" className="text-xs text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p
                    id="diagnostic-company-label"
                    className="text-sm font-medium text-foreground"
                  >
                    Empresa
                  </p>
                  <div
                    aria-labelledby="diagnostic-company-label"
                    className="flex h-8 items-center justify-between gap-2 rounded-lg border border-input bg-input/20 px-2.5 text-sm text-foreground dark:bg-input/30"
                  >
                    <span className="truncate">{organizationName}</span>
                    <LockKeyhole className="size-3.5 shrink-0 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="diagnostic-deadline"
                    className="text-sm font-medium text-foreground"
                  >
                    Prazo de resposta
                    <span className="font-normal text-muted-foreground">
                      {" "}(opcional)
                    </span>
                  </label>
                  <Input
                    id="diagnostic-deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(event) =>
                      updateField("deadline", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="diagnostic-description"
                  className="text-sm font-medium text-foreground"
                >
                  Descrição
                  <span className="font-normal text-muted-foreground">
                    {" "}(opcional)
                  </span>
                </label>
                <textarea
                  id="diagnostic-description"
                  value={form.description}
                  rows={4}
                  placeholder="Contexto interno para orientar a coleta."
                  className="min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="diagnostic-template"
                  className="text-sm font-medium text-foreground"
                >
                  Template
                </label>
                <Select
                  value={template.id}
                  disabled
                  items={[{ value: template.id, label: template.name }]}
                >
                  <SelectTrigger
                    id="diagnostic-template"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={template.id}>{template.name}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section
            aria-labelledby="diagnostic-leaders-title"
            className="flex flex-col gap-5 p-4 sm:p-6"
          >
            <div className="flex flex-col gap-1">
              <h3
                id="diagnostic-leaders-title"
                className="text-base font-semibold text-foreground"
              >
                Lideranças responsáveis
              </h3>
              <p className="max-w-[70ch] text-sm text-muted-foreground">
                Cada liderança selecionada verá o diagnóstico e receberá o link
                do seu setor para compartilhar com o time.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  className="pl-8"
                  placeholder="Buscar por nome, setor ou cargo"
                  aria-label="Buscar lideranças"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeSectors.length === 0}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    leaderIds:
                      current.leaderIds.length === activeSectors.length
                        ? []
                        : activeSectors.map((sector) => sector.leader.id),
                  }))
                }
              >
                {form.leaderIds.length === activeSectors.length
                  ? "Limpar seleção"
                  : "Selecionar todos"}
              </Button>
            </div>

            {errors.leaders && (
              <p className="text-xs text-destructive" role="alert">
                {errors.leaders}
              </p>
            )}

            <div className="overflow-x-auto rounded-lg border">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[2.5rem_minmax(0,1.5fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_7rem] border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span aria-hidden="true" />
                  <span>Liderança</span>
                  <span>Setor</span>
                  <span>Cargo</span>
                  <span>Acesso</span>
                </div>
                <div className="divide-y">
                  {visibleSectors.map((sector) => {
                    const enabled = sector.active && sector.inviteStatus === "ativo";
                    const checked = form.leaderIds.includes(sector.leader.id);

                    return (
                      <label
                        key={sector.id}
                        className={cn(
                          "grid grid-cols-[2.5rem_minmax(0,1.5fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_7rem] items-center px-3 py-3 text-sm",
                          enabled ? "hover:bg-muted/20" : "opacity-60",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!enabled}
                          className="size-4 accent-primary"
                          aria-label={`Selecionar ${sector.leader.name ?? sector.leader.email}`}
                          onChange={() => toggleLeader(sector.leader.id)}
                        />
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar size="sm">
                            {sector.leader.avatarUrl && (
                              <AvatarImage src={sector.leader.avatarUrl} alt="" />
                            )}
                            <AvatarFallback>
                              {initials(sector.leader.name, sector.leader.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">
                              {sector.leader.name ?? sector.leader.email}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {sector.leader.email}
                            </span>
                          </span>
                        </span>
                        <span className="truncate text-muted-foreground">
                          {sector.name}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {sector.leader.position}
                        </span>
                        <Badge variant={enabled ? "outline" : "secondary"}>
                          {enabled ? "Ativo" : "Pendente"}
                        </Badge>
                      </label>
                    );
                  })}
                  {visibleSectors.length === 0 && (
                    <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma liderança encontrada.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section
            aria-labelledby="diagnostic-review-title"
            className="grid min-h-full md:grid-cols-[minmax(0,1fr)_18rem]"
          >
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <div>
                <h3
                  id="diagnostic-review-title"
                  className="text-base font-semibold text-foreground"
                >
                  Revisão da configuração
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirme o escopo antes de ativar e gerar os links públicos.
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FileText className="size-4" /> Diagnóstico
                  </dt>
                  <dd className="mt-2 font-medium text-foreground">
                    {form.name.trim() || "Diagnóstico sem nome"}
                  </dd>
                  <dd className="mt-1 text-xs text-muted-foreground">
                    Criado por você
                  </dd>
                </div>
                <div className="rounded-lg border p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-4" /> Prazo
                  </dt>
                  <dd className="mt-2 font-medium text-foreground tabular-nums">
                    {formatDeadline(form.deadline)}
                  </dd>
                </div>
              </dl>

              <div className="overflow-hidden rounded-lg border">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    Setores participantes
                  </p>
                </div>
                <div className="divide-y">
                  {selectedSectors.map((sector) => (
                    <div
                      key={sector.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {sector.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {sector.leader.name ?? sector.leader.email}
                        </p>
                      </div>
                      <Badge variant="outline">1 link de time</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="border-t bg-muted/20 p-4 sm:p-6 md:border-t-0 md:border-l">
              <p className="text-sm font-medium text-foreground">
                Links que serão gerados
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fundador</span>
                  <span className="font-medium tabular-nums">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Liderança</span>
                  <span className="font-medium tabular-nums">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Times</span>
                  <span className="font-medium tabular-nums">
                    {selectedSectors.length}
                  </span>
                </div>
              </div>
              <Separator className="my-5" />
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {form.leaderIds.length} liderança
                  {form.leaderIds.length === 1 ? "" : "s"} verá
                  {form.leaderIds.length === 1 ? "" : "ão"} esta coleta na
                  própria listagem.
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>

      <footer className="shrink-0 border-t bg-card p-4 sm:px-6">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              <Save className="size-4" />
              Salvar como rascunho
            </Button>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => (current - 1) as Step)}
              >
                <ChevronLeft className="size-4" />
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Continuar
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleActivate}>
                <Send className="size-4" />
                Ativar diagnóstico
              </Button>
            )}
          </div>
        </div>
      </footer>
    </form>
  );
}
