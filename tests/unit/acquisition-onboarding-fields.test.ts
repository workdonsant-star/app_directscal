import { describe, expect, it } from "vitest";

import { acquisitionCoreFieldIds } from "@/lib/data/admin-data-source";
import { acquisitionCampaigns } from "@/lib/mock-data";
import { getProgressiveSectionSizes } from "@/components/admin/acquisition-progressive-form";

describe("acquisition onboarding fields", () => {
  const fields = acquisitionCampaigns[0].fields;

  it("keeps the complete onboarding sequence in a stable order", () => {
    expect(fields.map((field) => field.id)).toEqual([
      "nome",
      "email",
      "whatsapp",
      "cargo",
      "nicho_atuacao",
      "instagram_empresa",
      "website",
      "cnpj",
      "tamanho_empresa",
      "faturamento_ultimo_trimestre",
      "objetivo",
    ]);
  });

  it("uses the requested position and quarterly revenue options", () => {
    expect(fields.find((field) => field.id === "cargo")).toMatchObject({
      label: "Posição na empresa",
      options: [
        "Gerente",
        "Diretor",
        "Fundador",
        "CO-Fundador",
        "Sócio",
        "Líder",
      ],
      type: "select",
    });
    expect(
      fields.find(
        (field) => field.id === "faturamento_ultimo_trimestre",
      )?.options,
    ).toEqual([
      "Até R$ 250 mil",
      "R$ 250 mil a R$ 500 mil",
      "R$ 500 mil a R$ 1 milhão",
      "R$ 1 milhão a R$ 2 milhões",
      "R$ 2 milhões a R$ 5 milhões",
      "R$ 5 milhões a R$ 10 milhões",
      "R$ 10 milhões a R$ 25 milhões",
      "Acima de R$ 25 milhões",
    ]);
  });

  it("uses the challenges copy and protects every onboarding field", () => {
    expect(fields.find((field) => field.id === "objetivo")?.label).toBe(
      "Fale um pouco sobre seus desafios",
    );
    expect(acquisitionCoreFieldIds).toEqual(fields.map((field) => field.id));
    expect(fields.some((field) => field.id === "empresa")).toBe(false);
    expect(fields.find((field) => field.id === "cnpj")).toMatchObject({
      label: "CNPJ",
      required: true,
    });
  });

  it("keeps up to three campaign fields in each progressive section", () => {
    expect(getProgressiveSectionSizes(11)).toEqual([3, 3, 3, 2]);
    expect(getProgressiveSectionSizes(9)).toEqual([3, 3, 3]);
    expect(getProgressiveSectionSizes(12)).toEqual([3, 3, 3, 3]);
  });
});
