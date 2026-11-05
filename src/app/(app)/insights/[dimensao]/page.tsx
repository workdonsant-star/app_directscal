import { redirect } from "next/navigation";

import { isDimensionId } from "@/lib/data/omdx-domain";

type DimensionInsightPageProps = {
  params: Promise<{ dimensao: string }>;
  searchParams?: Promise<{ diagnostico?: string | string[] }>;
};

export default async function DimensionInsightPage({ params, searchParams }: DimensionInsightPageProps) {
  const { dimensao } = await params;
  const { diagnostico } = (await searchParams) ?? {};
  const query = new URLSearchParams();
  if (isDimensionId(dimensao)) query.set("dimensao", dimensao);
  if (typeof diagnostico === "string") query.set("diagnostico", diagnostico);
  redirect(`/omdx${query.size ? `?${query.toString()}` : ""}#nivel-perguntas`);
}
