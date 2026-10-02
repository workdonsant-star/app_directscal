import { ManagementAssetReaderPage } from "@/components/management-assets/management-asset-reader-page";

export const metadata = {
  title: "SOP — Directscal",
};

export default async function ManagementAssetReader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ManagementAssetReaderPage id={id} type="sop" libraryLabel="SOPs" />;
}
