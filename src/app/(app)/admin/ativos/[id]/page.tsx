import { redirect } from "next/navigation";

export default async function LegacyManagementAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/operacao/criacao-dos-ativos/${encodeURIComponent(id)}`);
}
