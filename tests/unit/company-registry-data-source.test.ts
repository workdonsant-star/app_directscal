import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CompanyRegistryLookupError,
  isValidCnpj,
  lookupCompanyByCnpj,
  mapMinhaReceitaCompany,
  normalizeCnpj,
} from "@/lib/data/company-registry-data-source";

describe("company registry data source", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes and validates formatted CNPJ", () => {
    expect(normalizeCnpj("33.683.111/0002-80")).toBe("33683111000280");
    expect(isValidCnpj("33.683.111/0002-80")).toBe(true);
    expect(isValidCnpj("11.111.111/1111-11")).toBe(false);
  });

  it("maps registered company data into lead values", () => {
    expect(
      mapMinhaReceitaCompany({
        cnpj: "33683111000280",
        razao_social: "SERVICO FEDERAL DE PROCESSAMENTO DE DADOS (SERPRO)",
        nome_fantasia: "REGIONAL BRASILIA-DF",
        descricao_situacao_cadastral: "ATIVA",
        data_inicio_atividade: "1967-06-30",
        cnae_fiscal: 6204000,
        cnae_fiscal_descricao: "Consultoria em tecnologia da informação",
        natureza_juridica: "Empresa Pública",
        porte: "DEMAIS",
        descricao_tipo_de_logradouro: "AVENIDA",
        logradouro: "L2 SGAN",
        numero: "601",
        complemento: "MODULO G",
        bairro: "ASA NORTE",
        cep: "70836900",
        municipio: "BRASILIA",
        uf: "DF",
      }),
    ).toEqual({
      companyName: "SERVICO FEDERAL DE PROCESSAMENTO DE DADOS (SERPRO)",
      values: expect.objectContaining({
        cnpj: "33683111000280",
        razao_social: "SERVICO FEDERAL DE PROCESSAMENTO DE DADOS (SERPRO)",
        nome_fantasia: "REGIONAL BRASILIA-DF",
        situacao_cadastral: "ATIVA",
        cnae_fiscal: "6204000",
        municipio_registro: "BRASILIA",
        uf_registro: "DF",
      }),
    });
  });

  it("does not call the upstream API for an invalid CNPJ", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupCompanyByCnpj("11.111.111/1111-11")).rejects.toEqual(
      new CompanyRegistryLookupError("Informe um CNPJ válido.", 400),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps an upstream 404 to a safe public error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    await expect(lookupCompanyByCnpj("33.683.111/0002-80")).rejects.toEqual(
      new CompanyRegistryLookupError("CNPJ não encontrado.", 404),
    );
  });
});
