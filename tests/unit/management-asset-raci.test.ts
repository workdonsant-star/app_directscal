import { describe, expect, it } from "vitest";
import { createManagementAssetInputSchema, managementAssetTransitionInputSchema, quickCreateManagementAssetInputSchema, editableManagementAssetTypeValues, richTextDocumentSchema } from "@/lib/contracts";
import { getManagementAssetTemplate, managementAssetTemplates } from "@/lib/data/management-asset-templates";
import { buildManagementAssetChunks } from "@/lib/data/management-asset-indexer";
import { legacySopContentToRichText } from "@/lib/data/rich-text";

describe("produção editorial dos quatro tipos", () => {
  it("aceita RACI na criação e oferece modelo do mesmo tipo", () => {
    expect(createManagementAssetInputSchema.safeParse({ organizationId: "00000000-0000-4000-8000-000000000001", type: "raci", title: "Matriz de decisões", summary: "Responsabilidades da operação", category: null, ownerLabel: "Operações", specialistId: null, templateId: "estrutura-raci" }).success).toBe(true);
    expect(getManagementAssetTemplate("estrutura-raci")?.type).toBe("raci");
  });
  it("aceita publicação direta e recusa a antiga etapa editorial", () => {
    expect(managementAssetTransitionInputSchema.safeParse({ action: "publicar" }).success).toBe(true);
    expect(managementAssetTransitionInputSchema.safeParse({ action: "enviar_para_revisao" }).success).toBe(false);
    expect(managementAssetTransitionInputSchema.safeParse({ action: "aprovar_revisao" }).success).toBe(false);
  });
  it("aceita somente categoria e tipo na criação rápida", () => {
    const input = { organizationId: "00000000-0000-4000-8000-000000000001", type: "sop", category: "Comercial" };
    expect(quickCreateManagementAssetInputSchema.safeParse(input).success).toBe(true);
    expect(quickCreateManagementAssetInputSchema.safeParse({ ...input, title: "Não permitido" }).success).toBe(false);
  });
  it("cada tipo tem ponto de partida validável e pesquisável", () => {
    for (const type of editableManagementAssetTypeValues) {
      const template = managementAssetTemplates.find(item => item.type === type);
      expect(template, type).toBeDefined();
      const content = richTextDocumentSchema.parse(legacySopContentToRichText(template!.content));
      const chunks = buildManagementAssetChunks({ title: `Ativo ${type}`, content });
      expect(chunks.length).toBeGreaterThan(0);
    }
  });
  it("preserva tabela e legenda RACI ao converter e indexar", () => {
    const template = getManagementAssetTemplate("estrutura-raci")!;
    const content = legacySopContentToRichText(template.content);
    expect(content.content.some(node => node.type === "table")).toBe(true);
    const indexed = buildManagementAssetChunks({ title: "RACI de decisões", content }).map(chunk => chunk.content).join(" ");
    for (const role of ["Execução (R)", "Aprovação (A)", "Consulta (C)", "Informação (I)"]) expect(indexed).toContain(role);
  });
});
