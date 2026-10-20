import { describe, expect, it } from "vitest";
import type { ManagementAsset } from "@/lib/contracts";
import { getManagementAssetCategoryFolders, getManagementAssetCategoryFolder, getManagementAssetsInCategory } from "@/lib/data/management-asset-categories";
import { getManagementAssetHref } from "@/lib/data/management-asset-routes";

function asset(category: string | null, type: ManagementAsset["type"]): ManagementAsset {
  return { id: `${category}-${type}`, organizationId: "empresa-teste", category, type, title: "Ativo de teste", summary: "Resumo", author: { name: "Equipe", role: "Operação" }, versionNumber: "1.0", publishedAt: "2026-10-03T12:00:00Z", updatedAt: "2026-10-03T12:00:00Z" };
}

describe("pastas de ativos por categoria", () => {
  it("agrupa todos os tipos pela categoria sem inferir Governança pelo tipo", () => {
    const assets = [asset("Comunicação", "sop"), asset("Comunicação", "governanca"), asset("Comunicação", "raci"), asset("Governança", "playbook")];
    expect(getManagementAssetsInCategory(assets, "comunicacao")).toHaveLength(3);
    expect(getManagementAssetsInCategory(assets, "governanca")).toEqual([assets[3]]);
  });

  it("normaliza acentos, caixa e espaços sem duplicar pastas", () => {
    const folders = getManagementAssetCategoryFolders([asset(" Comunicação ", "sop"), asset("COMUNICACAO", "playbook"), asset("Gestão   de pessoas", "raci")]);
    expect(folders.find(folder => folder.key === "comunicacao")?.count).toBe(2);
    expect(folders.find(folder => folder.key === "gestao de pessoas")?.count).toBe(1);
    expect(folders).toHaveLength(4);
  });

  it("mantém categorias adicionais e ativos sem categoria acessíveis", () => {
    const assets = [asset("Operação comercial", "sop"), asset(null, "raci")];
    const folders = getManagementAssetCategoryFolders(assets);
    expect(folders.reduce((total, folder) => total + folder.count, 0)).toBe(assets.length);
    expect(folders.find(folder => folder.key === "sem categoria")?.title).toBe("Sem categoria");
    expect(getManagementAssetCategoryFolder("Operação comercial").href).toBe("/ativos-de-gestao/categorias/operacao%20comercial");
  });

  it("preserva pastas vazias e a chave/URL depois de renomear", () => {
    const registry = [{ key: "categoria-estavel", title: "Nova área" }, { key: "cultura", title: "Valores" }];
    const assets = [asset("Nova área", "sop"), asset("Valores", "playbook")];
    const folders = getManagementAssetCategoryFolders(assets, registry);
    expect(folders.find(folder => folder.key === "categoria-estavel")?.count).toBe(1);
    expect(folders.find(folder => folder.key === "cultura")).toMatchObject({ title: "Valores", href: "/ativos-de-gestao/cultura", count: 1 });
    expect(getManagementAssetsInCategory(assets, "categoria-estavel", folders)).toEqual([assets[0]]);
    expect(getManagementAssetCategoryFolders([], registry).find(folder => folder.key === "categoria-estavel")?.count).toBe(0);
  });

  it("não recria categorias padrão excluídas e aceita nova pasta com o mesmo nome", () => {
    const folders = getManagementAssetCategoryFolders([], [{key:"cultura",title:"Cultura",deleted:true},{key:"nova-chave",title:"Cultura"}]);
    expect(folders.some(folder=>folder.key==="cultura")).toBe(false);
    expect(folders.find(folder=>folder.key==="nova-chave")?.title).toBe("Cultura");
  });

  it("permite abrir a Matriz RACI dentro da pasta", () => {
    expect(getManagementAssetHref("raci", "ativo-teste")).toBe("/ativos-de-gestao/matriz-raci/ativo-teste");
  });
});
