import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { submitLikertResponseInputSchema } from "@/lib/contracts";
import {
  getResponseCookieName,
  hasDiagnosticDeadlinePassed,
  hasCompleteLikertAnswerSet,
} from "@/lib/data/omdx-production-rules";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ShareLinkRow = {
  diagnostic_id: string;
  expires_at: string | null;
  group_id: "fundador" | "lideranca" | "operacao";
  id: string;
};

type DiagnosticStatusRow = {
  deadline: string | null;
  closed_at: string | null;
  status: "rascunho" | "ativo" | "encerrado";
  template_id: string;
};

type QuestionIdRow = {
  id: string;
};

const submissionAttempts = new Map<string, number[]>();
const maxAttempts = 5;
const rateLimitWindowMs = 60_000;

function logSupabaseError(scope: string, error: unknown) {
  console.error(`[omdx/responses] ${scope}`, error);
}

function isRateLimited(key: string) {
  const now = Date.now();
  const attempts = (submissionAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  );

  attempts.push(now);
  submissionAttempts.set(key, attempts);

  return attempts.length > maxAttempts;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = submitLikertResponseInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise seus dados e respostas." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  if (cookieStore.get(getResponseCookieName(parsed.data.token))?.value) {
    return NextResponse.json(
      { message: "Este navegador já registrou uma resposta para este link." },
      { status: 409 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: shareLink, error: shareLinkError } = await supabase
    .from("diagnostic_share_links")
    .select("id,diagnostic_id,group_id,expires_at")
    .eq("token", parsed.data.token)
    .maybeSingle<ShareLinkRow>();

  if (shareLinkError) {
    logSupabaseError("share link validation failed", shareLinkError);

    return NextResponse.json(
      { message: "Não foi possível validar o link." },
      { status: 500 },
    );
  }

  if (!shareLink) {
    return NextResponse.json({ message: "Link inválido." }, { status: 404 });
  }

  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return NextResponse.json({ message: "Link expirado." }, { status: 410 });
  }

  const { data: diagnostic, error: diagnosticError } = await supabase
    .from("diagnostics")
    .select("status,closed_at,template_id,deadline")
    .eq("id", shareLink.diagnostic_id)
    .maybeSingle<DiagnosticStatusRow>();

  if (diagnosticError) {
    logSupabaseError("diagnostic validation failed", diagnosticError);

    return NextResponse.json(
      { message: "Não foi possível validar a coleta." },
      { status: 500 },
    );
  }

  if (!diagnostic || diagnostic.status !== "ativo" || diagnostic.closed_at) {
    return NextResponse.json(
      { message: "Esta coleta não está disponível para resposta." },
      { status: 409 },
    );
  }

  if (hasDiagnosticDeadlinePassed(diagnostic.deadline)) {
    return NextResponse.json(
      { message: "O prazo desta pesquisa terminou. Não são aceitas novas respostas." },
      { status: 410 },
    );
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id")
    .eq("template_id", diagnostic.template_id)
    .returns<QuestionIdRow[]>();

  if (questionsError) {
    logSupabaseError("question validation failed", questionsError);

    return NextResponse.json(
      { message: "Não foi possível validar as perguntas." },
      { status: 500 },
    );
  }

  if (
    !hasCompleteLikertAnswerSet(
      parsed.data.answers,
      questions.map((question) => question.id),
    )
  ) {
    return NextResponse.json(
      { message: "Responda todas as perguntas antes de enviar." },
      { status: 400 },
    );
  }

  const { error: submissionError } = await supabase.schema("app_private").rpc("submit_anonymous_likert_response", {
    p_token: parsed.data.token,
    p_submission_id: parsed.data.submissionId,
    p_answers: parsed.data.answers,
  });
  if (submissionError) {
    const errors: Record<string, { status: number; message: string }> = {
      PT400: { status: 400, message: "Revise as respostas da coleta." },
      PT404: { status: 404, message: "Link inválido." },
      PT409: { status: 409, message: "A coleta não está disponível ou esta tentativa já registrou outras respostas." },
      PT410: { status: 410, message: "O prazo desta pesquisa ou link terminou." },
    };
    const known = errors[submissionError.code];
    if (known) return NextResponse.json({ message: known.message }, { status: known.status });
    logSupabaseError("atomic submission failed", submissionError);
    return NextResponse.json({ message: "Não foi possível registrar as respostas. Tente novamente." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true }, { status: 201 });

  response.cookies.set(getResponseCookieName(parsed.data.token), "1", {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
