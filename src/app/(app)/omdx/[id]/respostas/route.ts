import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getDiagnosticById } from "@/lib/data/omdx-data-source";
import { buildDiagnosticResponseCsv } from "@/lib/data/omdx-response-csv";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function filePart(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

export async function GET(_request: Request, { params }: Context) {
  const session = await getCurrentAuthSession();
  if (!session) return new Response("Sessão necessária.", { status: 401 });
  if (!canAccessCustomerApp(session.user)) {
    return new Response("Acesso restrito à área do cliente.", { status: 403 });
  }

  const { id } = await params;
  const diagnostic = await getDiagnosticById(id);
  if (!diagnostic) return new Response("Pesquisa não encontrada.", { status: 404 });

  try {
    const supabase = createSupabaseAdminClient();
    const { data: diagnosticRow, error: diagnosticError } = await supabase
      .from("diagnostics").select("template_id").eq("id", id).single();
    if (diagnosticError || !diagnosticRow) throw diagnosticError ?? new Error("Pesquisa sem template");

    const [questionsResult, dimensionsResult] = await Promise.all([
      supabase.from("questions").select("id,dimension_id,text,order_index")
        .eq("template_id", diagnosticRow.template_id),
      supabase.from("dimensions").select("id,name"),
    ]);
    if (questionsResult.error) throw questionsResult.error;
    if (dimensionsResult.error) throw dimensionsResult.error;

    const questions = new Map(questionsResult.data.map((question) => [question.id, question]));
    const dimensions = new Map(dimensionsResult.data.map((dimension) => [dimension.id, dimension.name]));
    const rows: Parameters<typeof buildDiagnosticResponseCsv>[0] = [];
    let responseNumber = 0;

    for (let offset = 0; ; offset += 500) {
      const { data: sessions, error: sessionsError } = await supabase
        .from("response_sessions")
        .select("id,group_id,submitted_at")
        .eq("diagnostic_id", id).eq("status", "concluido")
        .order("id").range(offset, offset + 499);
      if (sessionsError) throw sessionsError;
      if (sessions.length === 0) break;

      for (let index = 0; index < sessions.length; index += 25) {
        const batch = sessions.slice(index, index + 25);
        const sessionById = new Map(batch.map((item, batchIndex) => [
          item.id, { ...item, number: responseNumber + batchIndex + 1 },
        ]));
        responseNumber += batch.length;

        for (let answerOffset = 0; ; answerOffset += 500) {
          const { data: answers, error: answersError } = await supabase
            .from("likert_answers")
            .select("response_session_id,question_id,value")
            .in("response_session_id", batch.map((item) => item.id))
            .order("response_session_id").order("question_id")
            .range(answerOffset, answerOffset + 499);
          if (answersError) throw answersError;

          for (const answer of answers) {
            const response = sessionById.get(answer.response_session_id);
            const question = questions.get(answer.question_id);
            if (!response || !question) throw new Error("Resposta sem pergunta ou sessão");
            rows.push({
              responseNumber: response.number,
              group: response.group_id,
              submittedAt: response.submitted_at ?? "",
              dimension: dimensions.get(question.dimension_id) ?? "",
              question: question.text,
              value: answer.value,
            });
          }
          if (answers.length < 500) break;
        }
      }
      if (sessions.length < 500) break;
    }

    const csv = new TextEncoder().encode(buildDiagnosticResponseCsv(rows));
    return new Response(csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="respostas-${filePart(diagnostic.name)}-${id}.csv"`,
        "Content-Length": String(csv.byteLength),
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[omdx/respostas] Falha ao exportar respostas", error);
    return new Response("Não foi possível exportar as respostas.", { status: 500 });
  }
}
