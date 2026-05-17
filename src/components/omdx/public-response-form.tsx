"use client";

import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { getResponseStorageKey } from "@/lib/data/omdx-production-rules";
import { cn } from "@/lib/utils";
import type {
  DiagnosticResponseWorkspace,
  LikertAnswer,
  LikertScalePoint,
} from "@/lib/types";

type PublicResponseFormProps = {
  alreadySubmitted?: boolean;
  workspace: DiagnosticResponseWorkspace;
};

type LikertValue = LikertAnswer["value"];
type SubmissionState = "idle" | "submitting" | "submitted" | "error";

type MutationResponse = {
  message?: string;
};

const alreadySubmittedMessage =
  "Este navegador já registrou uma resposta para este link.";

function subscribeToBrowserStorage() {
  return () => {};
}

async function readMutationResponse(response: Response) {
  const data: unknown = await response.json().catch(() => null);

  return data && typeof data === "object" ? (data as MutationResponse) : {};
}

function getScaleLabel(scale: LikertScalePoint[], value: LikertValue) {
  return scale.find((item) => item.value === value)?.label ?? String(value);
}

export function PublicResponseForm({
  alreadySubmitted = false,
  workspace,
}: PublicResponseFormProps) {
  const router = useRouter();
  const questions = workspace.dimensions.flatMap((dimension) =>
    dimension.questions.map((question) => ({
      ...question,
      dimensionName: dimension.name,
      dimensionNumber: dimension.number,
    })),
  );
  const questionIndexById = new Map(
    questions.map((question, index) => [question.id, index + 1]),
  );
  const responseStorageKey = getResponseStorageKey(workspace.token);
  const storedSubmission = useSyncExternalStore(
    subscribeToBrowserStorage,
    () =>
      typeof window !== "undefined" &&
      Boolean(window.localStorage.getItem(responseStorageKey)),
    () => false,
  );
  const [answers, setAnswers] = useState<Record<string, LikertValue>>({});
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>(alreadySubmitted ? "submitted" : "idle");
  const [message, setMessage] = useState<string | null>(
    alreadySubmitted ? alreadySubmittedMessage : null,
  );
  const answeredCount = questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const isSubmitted = submissionState === "submitted" || storedSubmission;
  const isSubmitting = submissionState === "submitting";
  const visibleMessage =
    message ?? (storedSubmission ? alreadySubmittedMessage : null);

  useEffect(() => {
    if (storedSubmission) {
      router.replace(`/r/${workspace.token}/obrigado`);
    }
  }, [router, storedSubmission, workspace.token]);

  function updateAnswer(questionId: string, value: LikertValue) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (window.localStorage.getItem(responseStorageKey)) {
      setSubmissionState("submitted");
      setMessage(alreadySubmittedMessage);
      router.replace(`/r/${workspace.token}/obrigado`);
      return;
    }

    if (answeredCount !== questions.length) {
      setSubmissionState("error");
      setMessage("Responda todas as perguntas antes de enviar.");
      return;
    }

    try {
      setSubmissionState("submitting");
      setMessage(null);

      const response = await fetch("/api/omdx/responses", {
        body: JSON.stringify({
          token: workspace.token,
          answers: questions.map((question) => ({
            questionId: question.id,
            value: answers[question.id],
          })),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await readMutationResponse(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Não foi possível registrar a resposta.");
      }

      window.localStorage.setItem(
        responseStorageKey,
        new Date().toISOString(),
      );
      setSubmissionState("submitted");
      router.replace(`/r/${workspace.token}/obrigado`);
    } catch (error) {
      setSubmissionState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a resposta.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium text-foreground">
            Resposta anônima
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            O formulário não solicita nome, e-mail ou cargo. Após o envio, este
            navegador será marcado para evitar uma nova resposta pelo mesmo link.
          </p>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          A marcação fica restrita a este navegador e não carrega dados pessoais.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium text-foreground">
              Escala de resposta
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Escolha uma opção de 1 a 5 para cada afirmação.
            </p>
          </div>
          <div className="text-sm text-muted-foreground tabular-nums">
            {answeredCount}/{questions.length} respostas
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          {workspace.template.scale.map((item) => (
            <div key={item.value} className="rounded-lg border bg-background p-2">
              <div className="text-sm font-semibold tabular-nums">
                {item.value}
              </div>
              <div className="mt-1 text-xs leading-snug text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {workspace.dimensions.map((dimension) => (
        <section
          key={dimension.id}
          className="overflow-hidden rounded-lg border bg-card"
        >
          <div className="border-b bg-muted/30 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Dimensão {dimension.number}
            </div>
            <h2 className="mt-1 text-base font-medium text-foreground">
              {dimension.name}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {dimension.description}
            </p>
          </div>

          <div className="divide-y">
            {dimension.questions.map((question) => {
              const selectedValue = answers[question.id];

              return (
                <fieldset key={question.id} className="grid gap-3 px-4 py-4">
                  <legend className="text-sm font-medium leading-relaxed text-foreground">
                    <span className="mr-2 text-muted-foreground tabular-nums">
                      {questionIndexById.get(question.id)}.
                    </span>
                    {question.text}
                  </legend>

                  <div
                    role="radiogroup"
                    aria-label={question.text}
                    className="grid grid-cols-5 gap-1.5"
                  >
                    {workspace.template.scale.map((item) => (
                      <label key={item.value} className="min-w-0">
                        <input
                          className="peer sr-only"
                          type="radio"
                          name={`question-${question.id}`}
                          value={item.value}
                          checked={selectedValue === item.value}
                          onChange={() => updateAnswer(question.id, item.value)}
                          disabled={isSubmitting || isSubmitted}
                        />
                        <span
                          className={cn(
                            "flex h-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                            selectedValue === item.value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:bg-muted",
                            (isSubmitting || isSubmitted) &&
                              "cursor-not-allowed opacity-60 hover:bg-background",
                          )}
                        >
                          {item.value}
                          <span className="sr-only">
                            {getScaleLabel(workspace.template.scale, item.value)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        </section>
      ))}

      {visibleMessage && (
        <div
          role={submissionState === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
            submissionState === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-foreground",
          )}
        >
          {submissionState === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          )}
          <span>{visibleMessage}</span>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ao enviar, sua resposta entra na base consolidada do diagnóstico
            OMDx e este navegador fica bloqueado para novo envio deste link.
          </p>
          <Button
            type="submit"
            disabled={isSubmitting || isSubmitted}
            className="w-full sm:w-auto"
          >
            <Send className="size-4" />
            {isSubmitting
              ? "Enviando"
              : isSubmitted
                ? "Resposta enviada"
                : "Enviar resposta"}
          </Button>
        </div>
      </div>
    </form>
  );
}
