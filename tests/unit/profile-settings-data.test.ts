import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentAuthSession: vi.fn(),
}));

import type { AuthUser } from "@/lib/contracts";
import { updateProfileCommercialInputSchema } from "@/lib/contracts";
import {
  buildProfileSettingsData,
  formatCompanyDisplayName,
  mergeProfileCommercialValues,
} from "@/lib/data/profile-data-source";
import { mockUserProfile } from "@/lib/mock-data";

describe("buildProfileSettingsData", () => {
  it("uses natural casing for an uppercase fantasy name", () => {
    expect(formatCompanyDisplayName("DIRECTSCAL")).toBe("Directscal");
    expect(formatCompanyDisplayName("CASA DE NEGÓCIOS B2B")).toBe(
      "Casa de Negócios B2B",
    );
    expect(formatCompanyDisplayName("iFood Empresas")).toBe(
      "iFood Empresas",
    );
  });

  it("updates only commercial fields and preserves challenges and registry data", () => {
    const input = updateProfileCommercialInputSchema.parse({
      companySize: "51-200 pessoas",
      industry: "Educação",
      instagram: "@empresa",
      lastQuarterRevenue: "R$ 1 milhão a R$ 2 milhões",
      position: "Diretor",
      socialName: "Empresa Nova",
      website: "empresa.com.br",
    });

    expect(
      mergeProfileCommercialValues(
        {
          cnpj: "33683111000280",
          objetivo: "Desafio que deve permanecer",
          razao_social: "EMPRESA LTDA",
        },
        input,
      ),
    ).toMatchObject({
      cargo: "Diretor",
      cnpj: "33683111000280",
      faturamento_ultimo_trimestre: "R$ 1 milhão a R$ 2 milhões",
      nicho_atuacao: "Educação",
      nome_fantasia: "Empresa Nova",
      objetivo: "Desafio que deve permanecer",
      razao_social: "EMPRESA LTDA",
      tamanho_empresa: "51-200 pessoas",
    });
  });

  it("uses the authenticated user identity instead of the mock profile", () => {
    const user: AuthUser = {
      id: "user_joao",
      name: "João Felix",
      email: "joaofelix@shippingcaps.com.br",
      company: "Shipping Caps",
      role: "cliente",
    };

    const profile = buildProfileSettingsData({ user });

    expect(profile.id).toBe(user.id);
    expect(profile.name).toBe(user.name);
    expect(profile.email).toBe(user.email);
    expect(profile.company).toBe(user.company);
    expect(profile.employeeCount).toBe(mockUserProfile.employeeCount);
    expect(profile.name).not.toBe(mockUserProfile.name);
    expect(profile.companyDetails.officialName).toBe(user.company);
  });

  it("maps onboarding and CNPJ data into the company profile", () => {
    const user: AuthUser = {
      id: "9b0bb4f3-a5f8-4dcf-bdf5-ec14b33f9c1a",
      name: "João Felix",
      email: "joaofelix@shippingcaps.com.br",
      company: "Shipping Caps",
      role: "cliente",
    };

    const profile = buildProfileSettingsData({
      user,
      organization: {
        id: "2240d456-5b93-4d5b-9622-3a18d2e43b89",
        name: "Nome antigo",
        employee_count: 50,
        created_at: "2026-08-26T10:00:00.000Z",
        updated_at: "2026-08-26T10:00:00.000Z",
      },
      lead: {
        company_name: "SHIPPING CAPS LTDA",
        company_size: "11-50 pessoas",
        objective: "Estruturar a operação",
        organization_id: "2240d456-5b93-4d5b-9622-3a18d2e43b89",
        role: "Fundador",
        updated_at: "2026-08-26T11:00:00.000Z",
        field_values: {
          cnpj: "33683111000280",
          razao_social: "SHIPPING CAPS LTDA",
          nome_fantasia: "SHIPPING CAPS",
          situacao_cadastral: "ATIVA",
          data_inicio_atividade: "2021-06-14",
          cnae_fiscal: "6204000",
          cnae_fiscal_descricao: "Consultoria em tecnologia",
          natureza_juridica: "Sociedade Empresária Limitada",
          porte_receita: "MICRO EMPRESA",
          endereco_registrado: "Avenida Central, 100",
          municipio_registro: "São Paulo",
          uf_registro: "SP",
          nicho_atuacao: "Tecnologia",
          instagram_empresa: "@shippingcaps",
          website: "shippingcaps.com.br",
          faturamento_ultimo_trimestre: "R$ 500 mil a R$ 1 milhão",
        },
      },
    });

    expect(profile.company).toBe("Shipping Caps");
    expect(profile.employeeCount).toBe(50);
    expect(profile.companyDetails).toMatchObject({
      socialName: "Shipping Caps",
      officialName: "SHIPPING CAPS LTDA",
      cnpj: "33683111000280",
      registrationStatus: "ATIVA",
      industry: "Tecnologia",
      instagram: "@shippingcaps",
      website: "shippingcaps.com.br",
      lastQuarterRevenue: "R$ 500 mil a R$ 1 milhão",
      challenges: "Estruturar a operação",
    });
  });
});
