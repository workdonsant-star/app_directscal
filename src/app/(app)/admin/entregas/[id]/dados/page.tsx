import { redirect } from "next/navigation";

export default async function AdminDeliveryDataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/entregas/${id}/relatorio`);
}
