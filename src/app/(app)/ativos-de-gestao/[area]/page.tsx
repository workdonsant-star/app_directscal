import { notFound } from "next/navigation";
import { ManagementAssetCategoryPage } from "@/components/management-assets/management-asset-category-page";
import { managementAssetDefaultCategories } from "@/lib/data/management-asset-categories";

export default async function ManagementAreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const folder = managementAssetDefaultCategories.find(item => item.href === `/ativos-de-gestao/${area}`);
  if (!folder) notFound();
  return <ManagementAssetCategoryPage categoryKey={folder.key} />;
}
