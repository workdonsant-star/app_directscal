import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { submitLikertResponseInputSchema } from "@/lib/contracts";
import {
  getResponseCookieName,
  normalizeRespondentEmail,
} from "@/lib/data/omdx-production-rules";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ShareLinkRow = {
  diagnostic_id: string;
  expires_at: string | null;
  group_id: "fundador" | "lideranca" | "operacao";
  id: string;
};

type DiagnosticStatusRow = {
  closed_at: string | null;
  status: "rascunho" | "ativo" | "encerrado";
};

type RespondentRow = {
  id: string;
};

const submissionAttempts = new Map<string, number[]>();
const maxAttempts = 5;
const rateLimitWindowMs = 60_000;

function isRateLimited(key: string) {
  const now = Date.now();
  const attempts = (submissionAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  );

  attempts.push(now);
  submissionAttempts.set(key, attempts);

  return attempts.length > maxAttempts;
}

function duplicateResponse() {
  return NextResponse.json(
    { message: "Este e-mail já respondeu por este grupo." },
    { status: 409 },
  );
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
    .select("status,closed_at")
    .eq("id", shareLink.diagnostic_id)
    .maybeSingle<DiagnosticStatusRow>();

  if (diagnosticError) {
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

  const normalizedEmail = normalizeRespondentEmail(parsed.data.respondent.email);
  const { data: existingRespondent, error: existingError } = await supabase
    .from("respondents")
    .select("id")
    .eq("diagnostic_id", shareLink.diagnostic_id)
    .eq("group_id", shareLink.group_id)
    .eq("normalized_email", normalizedEmail)
    .maybeSingle<RespondentRow>();

  if (existingError) {
    return NextResponse.json(
      { message: "Não foi possível verificar respostas anteriores." },
      { status: 500 },
    );
  }

  if (existingRespondent) return duplicateResponse();

  const { data: respondent, error: respondentError } = await supabase
    .from("respondents")
    .insert({
      diagnostic_id: shareLink.diagnostic_id,
      email: normalizedEmail,
      group_id: shareLink.group_id,
      name: parsed.data.respondent.name,
      role: parsed.data.respondent.role,
    })
    .select("id")
    .single<RespondentRow>();

  if (respondentError) {
    if (respondentError.code === "23505") return duplicateResponse();

    return NextResponse.json(
      { message: "Não foi possível registrar o respondente." },
      { status: 500 },
    );
  }

  const submittedAt = new Date().toISOString();
  const { data: responseSession, error: sessionError } = await supabase
    .from("response_sessions")
    .insert({
      diagnostic_id: shareLink.diagnostic_id,
      group_id: shareLink.group_id,
      respondent_id: respondent.id,
      share_link_id: shareLink.id,
      status: "concluido",
      submitted_at: submittedAt,
    })
    .select("id")
    .single<{ id: string }>();

  if (sessionError) {
    return NextResponse.json(
      { message: "Não foi possível registrar a sessão de resposta." },
      { status: 500 },
    );
  }

  const { error: answersError } = await supabase.from("likert_answers").insert(
    parsed.data.answers.map((answer) => ({
      question_id: answer.questionId,
      response_session_id: responseSession.id,
      value: answer.value,
    })),
  );

  if (answersError) {
    return NextResponse.json(
      { message: "Não foi possível registrar as respostas." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true }, { status: 201 });

  response.cookies.set(getResponseCookieName(parsed.data.token), "1", {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
