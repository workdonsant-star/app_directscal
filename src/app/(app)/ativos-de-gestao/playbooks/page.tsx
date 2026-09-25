import { ManagementAssetsPage } from "@/components/management-assets/management-assets-page";

export const metadata = {
  title: "Playbooks — Directscal",
};

export default function ManagementAssetsPlaybooksPage() {
  return (
    <ManagementAssetsPage
      type="playbook"
      title="Playbooks"
      description="Consulte orientações práticas para decisões e situações recorrentes da operação."
      categoryFilter
    />
  );
}
