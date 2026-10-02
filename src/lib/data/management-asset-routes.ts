import type { ManagementAssetType } from "@/lib/contracts";

const libraryPathByType: Record<ManagementAssetType, string> = {
  sop: "/ativos-de-gestao/sops",
  playbook: "/ativos-de-gestao/playbooks",
  governanca: "/ativos-de-gestao/governanca",
  raci: "/ativos-de-gestao/matriz-raci",
};

// Tipos com leitura individual. A matriz RACI ainda não tem componente próprio.
const readableTypes = new Set<ManagementAssetType>(["sop", "playbook", "governanca"]);

export function getManagementAssetLibraryHref(type: ManagementAssetType) {
  return libraryPathByType[type];
}

export function getManagementAssetHref(type: ManagementAssetType, id: string) {
  return readableTypes.has(type) ? `${libraryPathByType[type]}/${id}` : null;
}
