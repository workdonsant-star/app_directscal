import { ManagementAssetCategoryPage } from "@/components/management-assets/management-asset-category-page";

export default async function CategoryPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  return <ManagementAssetCategoryPage categoryKey={categoria} />;
}
