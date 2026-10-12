import { redirect } from "next/navigation";

// Mantém links antigos (?aba=ativos&ativo=<id> e &perguntas=1) funcionando.
export default async function AdminDeliveryIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; ativo?: string; perguntas?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const base = `/admin/entregas/${id}`;

  if (query.ativo) redirect(`${base}/ativos/${encodeURIComponent(query.ativo)}`);
  if (query.perguntas === "1") redirect(`${base}/ativos/perguntas`);

  const legacyTabs: Record<string, string> = {
    ativos: "ativos",
    relatorio: "relatorio",
    "action-points": "action-points",
    publicacao: "publicar",
  };

  redirect(`${base}/${(query.aba && legacyTabs[query.aba]) || "dados"}`);
}
