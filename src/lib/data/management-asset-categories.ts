import type { ManagementAsset } from "@/lib/contracts";

export type ManagementAssetCategoryFolder = {
  key: string;
  title: string;
  href: string;
  count: number;
};

export function normalizeManagementAssetCategory(category: string | null) {
  return category?.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR") || "sem categoria";
}

export const managementAssetDefaultCategories = [
  { key: "gestao de pessoas", title: "Gestão de pessoas", href: "/ativos-de-gestao/gestao-de-pessoas" },
  { key: "governanca", title: "Governança", href: "/ativos-de-gestao/area-governanca" },
  { key: "cultura", title: "Cultura", href: "/ativos-de-gestao/cultura" },
  { key: "comunicacao", title: "Comunicação", href: "/ativos-de-gestao/comunicacao" },
] as const;

export function getManagementAssetCategoryFolder(category: string | null) {
  const key = normalizeManagementAssetCategory(category);
  const predefined = managementAssetDefaultCategories.find(folder => folder.key === key);
  return predefined ?? {
    key,
    title: category?.trim().replace(/\s+/g, " ") || "Sem categoria",
    href: `/ativos-de-gestao/categorias/${encodeURIComponent(key)}`,
  };
}

export function getManagementAssetCategoryFolders(assets: Pick<ManagementAsset, "category">[]) {
  const folders = new Map<string, ManagementAssetCategoryFolder>(
    managementAssetDefaultCategories.map(folder => [folder.key, { ...folder, count: 0 }]),
  );
  for (const asset of assets) {
    const folder = getManagementAssetCategoryFolder(asset.category);
    const current = folders.get(folder.key);
    if (current) current.count += 1;
    else folders.set(folder.key, { ...folder, count: 1 });
  }
  return [...folders.values()];
}

export function getManagementAssetsInCategory(assets: ManagementAsset[], key: string) {
  return assets.filter(asset => normalizeManagementAssetCategory(asset.category) === key);
}
