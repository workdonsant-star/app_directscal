import { describe, expect, it } from "vitest";

import {
  createManagementAsset,
  listAdminManagementAssets,
  transitionManagementAsset,
} from "@/lib/data/management-assets-admin-data-source";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";

// Publica os SOPs de modelo numa empresa de teste usando o mesmo fluxo
// editorial do admin: criar, enviar para revisão, aprovar e publicar.
// Exige ASSET_EVAL_ALLOW_SEED=true para não rodar por engano.
const organizationId = process.env.ASSET_EVAL_ORGANIZATION_ID;
const actorUserId = process.env.ASSET_EVAL_ACTOR_USER_ID;
const allowSeed = process.env.ASSET_EVAL_ALLOW_SEED === "true";

describe.runIf(Boolean(organizationId && actorUserId && allowSeed))("seed do piloto", () => {
  it("publica os SOPs de modelo que ainda não existem na empresa", async () => {
    const existing = await listAdminManagementAssets();
    const existingTitles = new Set(
      existing
        .filter((asset) => asset.organizationId === organizationId)
        .map((asset) => asset.title),
    );

    for (const template of managementAssetTemplates) {
      if (!template.title || !template.summary || existingTitles.has(template.title)) continue;

      const assetId = await createManagementAsset(actorUserId!, {
        organizationId: organizationId!,
        type: template.type,
        title: template.title,
        summary: template.summary,
        category: template.category ?? "Operação",
        ownerLabel: template.ownerLabel ?? "Directscal",
        reviewCycle: template.reviewCycle ?? "Semestral",
        specialistId: null,
        templateId: template.id,
      });

      await transitionManagementAsset(actorUserId!, assetId, "enviar_para_revisao");
      await transitionManagementAsset(actorUserId!, assetId, "aprovar_revisao");
      const { notice } = await transitionManagementAsset(actorUserId!, assetId, "publicar");

      console.log(`Publicado: ${template.title} — ${notice}`);
    }

    const published = (await listAdminManagementAssets()).filter(
      (asset) => asset.organizationId === organizationId && asset.status === "publicado",
    );
    expect(published.length).toBeGreaterThanOrEqual(4);
  });
});
