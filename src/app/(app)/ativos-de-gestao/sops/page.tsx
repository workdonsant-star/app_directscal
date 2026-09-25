import { ManagementAssetsPage } from "@/components/management-assets/management-assets-page";

export const metadata = {
  title: "SOPs — Directscal",
};

export default function ManagementAssetsSopsPage() {
  return (
    <ManagementAssetsPage
      type="sop"
      title="SOPs"
      description="Consulte os procedimentos operacionais publicados para a empresa."
      categoryFilter
    />
  );
}
