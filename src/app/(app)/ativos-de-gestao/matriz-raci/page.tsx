import { ManagementAssetsPage } from "@/components/management-assets/management-assets-page";

export const metadata = {
  title: "Matriz RACI — Directscal",
};

export default function ManagementAssetsRaciPage() {
  return (
    <ManagementAssetsPage
      type="raci"
      title="Matriz RACI"
      description="Consulte as responsabilidades definidas para processos e projetos da empresa."
      categoryFilter={false}
    />
  );
}
