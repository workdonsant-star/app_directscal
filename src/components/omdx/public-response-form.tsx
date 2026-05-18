"use client";

import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getResponseStorageKey } from "@/lib/data/omdx-production-rules";
import { cn } from "@/lib/utils";
import type {
  DiagnosticResponseWorkspace,
  LikertAnswer,
  LikertScalePoint,
} from "@/lib/types";

type PublicResponseFormProps = {
  alreadySubmitted?: boolean;
  questionOrderSeed: string;
  workspace: DiagnosticResponseWorkspace;
};

type LikertValue = LikertAnswer["value"];
type SubmissionState = "idle" | "submitting" | "submitted" | "error";
type PublicQuestion =
  DiagnosticResponseWorkspace["dimensions"][number]["questions"][number] & {
    dimensionName: string;
    dimensionNumber: number;
  };

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

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashSeed(seed) || 1;

  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function shuffleItems<T>(items: T[], seed: string) {
  const shuffled = [...items];
  const random = createSeededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [
      shuffled[targetIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function PublicResponseForm({
  alreadySubmitted = false,
  questionOrderSeed,
  workspace,
}: PublicResponseFormProps) {
  const router = useRouter();
  const questionElementsRef = useRef(new Map<string, HTMLFieldSetElement>());
  const questions: PublicQuestion[] = workspace.dimensions.flatMap((dimension) =>
    dimension.questions.map((question) => ({
      ...question,
      dimensionName: dimension.name,
      dimensionNumber: dimension.number,
    })),
  );
  const [orderedQuestions] = useState(() =>
    shuffleItems(questions, questionOrderSeed),
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
  const [introDialogOpen, setIntroDialogOpen] = useState(!alreadySubmitted);
  const [invalidQuestionId, setInvalidQuestionId] = useState<string | null>(
    null,
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

  useEffect(() => {
    const elements = Array.from(questionElementsRef.current.values());

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.dataset.visible = "true";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          element.dataset.visible = "true";
          observer.unobserve(element);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [orderedQuestions]);

  function updateAnswer(questionId: string, value: LikertValue) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));

    if (invalidQuestionId === questionId) {
      setInvalidQuestionId(null);
      setMessage(null);
      setSubmissionState("idle");
    }
  }

  function scrollToQuestion(questionId: string) {
    const element = questionElementsRef.current.get(questionId);

    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    element.dataset.visible = "true";
    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
    window.setTimeout(() => {
      element.focus({ preventScroll: true });
    }, prefersReducedMotion ? 0 : 240);
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
      const firstUnansweredQuestion = orderedQuestions.find(
        (question) => answers[question.id] === undefined,
      );

      setSubmissionState("error");
      setMessage("Responda a pergunta destacada antes de enviar.");

      if (firstUnansweredQuestion) {
        setInvalidQuestionId(firstUnansweredQuestion.id);
        scrollToQuestion(firstUnansweredQuestion.id);
      }

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
      <Dialog open={introDialogOpen} onOpenChange={setIntroDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como responder</DialogTitle>
            <DialogDescription>
              Leia cada afirmação e marque a alternativa que melhor representa
              sua percepção atual da operação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              As perguntas aparecem em ordem aleatória e todas precisam ser
              respondidas antes do envio.
            </p>
            <p>
              A resposta é anônima, consolidada por grupo e não solicita nome,
              e-mail ou cargo.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setIntroDialogOpen(false)}
            >
              Começar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        aria-label="Progresso de respostas"
        aria-valuemax={questions.length}
        aria-valuemin={0}
        aria-valuenow={answeredCount}
        className="h-1 overflow-hidden bg-muted"
        role="progressbar"
      >
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="divide-y border-y">
        {orderedQuestions.map((question, index) => {
          const selectedValue = answers[question.id];
          const isInvalid = invalidQuestionId === question.id;
          const errorId = `question-${question.id}-error`;

          return (
            <fieldset
              key={question.id}
              ref={(element) => {
                if (element) {
                  questionElementsRef.current.set(question.id, element);
                } else {
                  questionElementsRef.current.delete(question.id);
                }
              }}
              aria-describedby={isInvalid ? errorId : undefined}
              aria-invalid={isInvalid || undefined}
              className={cn(
                "grid scroll-mt-24 gap-7 px-0 py-8 opacity-0 outline-none transition-[background-color,box-shadow,opacity,transform] duration-200 ease-out data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none",
                "translate-y-2 hover:bg-muted/20 focus-visible:ring-3 focus-visible:ring-ring/50",
                isInvalid &&
                  "bg-destructive/5 text-destructive ring-1 ring-destructive/35 hover:bg-destructive/5",
              )}
              tabIndex={-1}
            >
              <legend
                className={cn(
                  "w-full text-sm font-semibold leading-relaxed text-foreground sm:text-base",
                  isInvalid && "text-destructive",
                )}
              >
                <span className="sr-only">
                  Dimensão {question.dimensionNumber}: {question.dimensionName}.{" "}
                </span>
                <span className="mr-2 text-muted-foreground tabular-nums">
                  {index + 1}.
                </span>
                {question.text}
              </legend>

              <div
                role="radiogroup"
                aria-label={question.text}
                className="grid gap-3"
              >
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute left-[10%] right-[10%] top-2 h-px bg-border",
                      isInvalid && "bg-destructive/40",
                    )}
                  />
                  <div className="grid grid-cols-5">
                    {workspace.template.scale.map((item) => {
                      const itemLabel = getScaleLabel(
                        workspace.template.scale,
                        item.value,
                      );
                      const isSelected = selectedValue === item.value;

                      return (
                        <label
                          key={item.value}
                          className={cn(
                            "group/option relative z-10 flex min-w-0 cursor-pointer flex-col items-center gap-4 text-center",
                            (isSubmitting || isSubmitted) &&
                              "cursor-not-allowed",
                          )}
                        >
                          <input
                            aria-describedby={isInvalid ? errorId : undefined}
                            className="peer sr-only"
                            type="radio"
                            name={`question-${question.id}`}
                            value={item.value}
                            checked={isSelected}
                            onChange={() =>
                              updateAnswer(question.id, item.value)
                            }
                            disabled={isSubmitting || isSubmitted}
                          />
                          <span
                            aria-hidden="true"
                            className={cn(
                              "size-4 rounded-full border bg-background transition-[background-color,border-color,box-shadow] peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                              isSelected
                                ? "border-primary bg-primary ring-3 ring-primary/15"
                                : "border-border group-hover/option:border-muted-foreground/60",
                              isInvalid &&
                                !isSelected &&
                                "border-destructive/50",
                              (isSubmitting || isSubmitted) && "opacity-60",
                            )}
                          />
                          <span
                            className={cn(
                              "max-w-full px-1 text-[0.68rem] leading-snug text-muted-foreground transition-colors peer-checked:text-foreground sm:text-xs",
                              isInvalid && "text-destructive",
                              (isSubmitting || isSubmitted) && "opacity-60",
                            )}
                          >
                            {itemLabel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {isInvalid && (
                  <p
                    id={errorId}
                    className="text-xs font-medium text-destructive"
                  >
                    Selecione uma alternativa para esta pergunta.
                  </p>
                )}
              </div>
            </fieldset>
          );
        })}
      </div>

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

      <div className="border-t pt-4">
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting || isSubmitted}
            className="h-12 w-full sm:w-auto sm:min-w-56"
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
