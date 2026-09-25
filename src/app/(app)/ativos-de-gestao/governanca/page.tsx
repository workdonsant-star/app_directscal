import { ManagementAssetsPage } from "@/components/management-assets/management-assets-page";

export const metadata = {
  title: "Governança — Directscal",
};

export default function ManagementAssetsGovernancePage() {
  return (
    <ManagementAssetsPage
      type="governanca"
      title="Governança"
      description="Consulte ritos, políticas e critérios que orientam a gestão da empresa."
      categoryFilter
    />
  );
}
