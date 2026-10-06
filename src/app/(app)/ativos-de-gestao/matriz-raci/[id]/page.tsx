import { ManagementAssetReaderPage } from "@/components/management-assets/management-asset-reader-page";

export const metadata = { title: "Matriz RACI — Directscal" };

export default async function RaciReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ManagementAssetReaderPage id={id} type="raci" libraryLabel="Matriz RACI" />;
}
