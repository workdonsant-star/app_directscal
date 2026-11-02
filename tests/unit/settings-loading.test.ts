import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/profile-data-source", () => ({ getProfileSettingsData: vi.fn() }));
vi.mock("@/lib/data/organization-structure-data-source", () => ({ getOrganizationStructure: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackInstallationForOrganization: vi.fn(), isSlackOAuthConfigured: () => false }));
vi.mock("@/components/app-topbar", () => ({ AppTopbar: () => null }));
vi.mock("@/components/settings/company-settings", () => ({ CompanySettings: () => null }));
vi.mock("@/components/settings/organization-structure-settings", () => ({ OrganizationStructureSettings: () => null }));
vi.mock("@/components/settings/slack-integration-settings", () => ({ SlackIntegrationSettings: () => null }));

import SettingsPage from "@/app/(app)/configuracoes/page";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";
import { getSlackInstallationForOrganization } from "@/lib/integrations/slack";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { role: "cliente" } } as Awaited<ReturnType<typeof getCurrentAuthSession>>);
  vi.mocked(getProfileSettingsData).mockResolvedValue({ organizationId: "org_test" } as Awaited<ReturnType<typeof getProfileSettingsData>>);
  vi.mocked(getOrganizationStructure).mockResolvedValue([]);
  vi.mocked(getSlackInstallationForOrganization).mockResolvedValue(null);
});

it("abre Empresa sem depender de consultas a setores ou Slack", async () => {
  await SettingsPage({ searchParams: Promise.resolve({ secao: "empresa" }) });
  expect(getOrganizationStructure).not.toHaveBeenCalled();
  expect(getSlackInstallationForOrganization).not.toHaveBeenCalled();
});

it("consulta somente setores na seção padrão", async () => {
  await SettingsPage({ searchParams: Promise.resolve({}) });
  expect(getOrganizationStructure).toHaveBeenCalledWith("org_test");
  expect(getSlackInstallationForOrganization).not.toHaveBeenCalled();
});

it("consulta somente a integração ao retornar do Slack", async () => {
  await SettingsPage({ searchParams: Promise.resolve({ slack: "connected" }) });
  expect(getSlackInstallationForOrganization).toHaveBeenCalledWith("org_test");
  expect(getOrganizationStructure).not.toHaveBeenCalled();
});
