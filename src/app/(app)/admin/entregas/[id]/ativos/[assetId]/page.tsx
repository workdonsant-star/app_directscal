import Link from "next/link";
import { notFound } from "next/navigation";

import { ManagementAssetEditorWorkspace } from "@/components/admin/management-asset-editor-workspace";
import { loadAdminDeliveryContext } from "@/lib/data/admin-delivery-workspace-data";
import {
  getAdminManagementAssetDetail,
  ManagementAssetError,
} from "@/lib/data/management-assets-admin-data-source";

export default async function AdminDeliveryAssetEditorPage({
  params,
}: {
  params: Promise<{ id: string; assetId: string }>;
}) {
  const { id, assetId } = await params;
  const context = await loadAdminDeliveryContext(id);

  if (!context) notFound();

  const asset = await getAdminManagementAssetDetail(assetId).catch(
    (error: unknown) => {
      if (error instanceof ManagementAssetError && error.status === 404) return null;
      throw error;
    },
  );

  // O servidor recusa ativo de outra empresa: a entrega só edita ativos da própria organização.
  if (!asset || asset.organizationId !== context.company.organizationId) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/entregas/${id}/ativos`}
        className="inline-block rounded-sm text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Voltar aos ativos da empresa
      </Link>
      <ManagementAssetEditorWorkspace
        key={asset.id}
        initialAsset={asset}
        specialists={context.specialists}
        embedded
        deliveryId={id}
      />
    </div>
  );
}
