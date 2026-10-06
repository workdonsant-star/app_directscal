import type { ManagementAssetType } from "@/lib/contracts";

const libraryPathByType: Record<ManagementAssetType, string> = {
  sop: "/ativos-de-gestao/sops",
  playbook: "/ativos-de-gestao/playbooks",
  governanca: "/ativos-de-gestao/governanca",
  raci: "/ativos-de-gestao/matriz-raci",
};

export function getManagementAssetLibraryHref(type: ManagementAssetType) {
  return libraryPathByType[type];
}

export function getManagementAssetHref(type: ManagementAssetType, id: string) {
  return `${libraryPathByType[type]}/${id}`;
}
