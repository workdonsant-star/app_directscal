import { describe, expect, it } from "vitest";
import { getClientOnboardingProgress } from "@/lib/data/client-onboarding";
import type { OrganizationSector } from "@/lib/types";

const connection = { scope: "users:read,im:write" };
const sector: OrganizationSector = {
  id: "sector-1", name: "Operação", active: true,
  createdAt: "2026-10-12T12:00:00Z", lastInviteSentAt: "2026-10-12T12:00:00Z",
  inviteStatus: "convite_enviado",
  leader: { id: "leader-1", name: null, avatarUrl: null, email: "lider@example.com", position: "Líder", accessLevel: "admin" },
};

describe("configuração inicial do cliente", () => {
  it("exige Slack e ao menos um setor", () => {
    expect(getClientOnboardingProgress(null, []).canComplete).toBe(false);
    expect(getClientOnboardingProgress(connection, []).canComplete).toBe(false);
    expect(getClientOnboardingProgress(null, [sector]).canComplete).toBe(false);
  });
  it("exige permissões para pessoas e conversas do Slack", () => {
    expect(getClientOnboardingProgress({ scope: "chat:write" }, [sector]).canComplete).toBe(false);
    expect(getClientOnboardingProgress({ scope: null }, [sector]).canComplete).toBe(false);
  });
  it("libera com convite enviado, sem aguardar o aceite Google", () => {
    expect(getClientOnboardingProgress(connection, [sector]).canComplete).toBe(true);
    expect(getClientOnboardingProgress(connection, [{ ...sector, inviteStatus: "ativo" }]).canComplete).toBe(true);
  });
  it.each(["convite_pendente", "envio_falhou", "inativo"] as const)("bloqueia setor ativo com liderança %s", (inviteStatus) => {
    expect(getClientOnboardingProgress(connection, [sector, { ...sector, id: "sector-2", inviteStatus }]).canComplete).toBe(false);
  });
  it("ignora setores inativos, sem contá-los como estrutura mínima", () => {
    expect(getClientOnboardingProgress(connection, [{ ...sector, active: false }]).canComplete).toBe(false);
    expect(getClientOnboardingProgress(connection, [sector, { ...sector, active: false, inviteStatus: "envio_falhou" }]).canComplete).toBe(true);
  });
  it("bloqueia setores ativos sem vínculo de liderança que não aparecem no DTO", () => {
    expect(getClientOnboardingProgress(connection, [sector], 2).canComplete).toBe(false);
  });
});


describe("lideranças externas do Slack", () => {
  const slackSector: OrganizationSector = { ...sector, inviteStatus: "ativo", lastInviteSentAt: null, leader: { ...sector.leader, email: "", position: "", slackTeamId: "T123", slackUserId: "U123" } };
  it("libera sem e-mail, cargo, convite ou conta Google", () => {
    expect(getClientOnboardingProgress(connection, [slackSector]).canComplete).toBe(true);
  });
  it("bloqueia pessoa indisponível no workspace e referência sem time", () => {
    expect(getClientOnboardingProgress(connection, [{ ...slackSector, inviteStatus: "inativo" }]).canComplete).toBe(false);
    expect(getClientOnboardingProgress(connection, [{ ...slackSector, leader: { ...slackSector.leader, slackTeamId: undefined } }]).canComplete).toBe(false);
  });
});
