import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createOrganizationSectorInputSchema } from "@/lib/contracts";
import { resolvePendingLeadershipGoogleUser } from "@/lib/auth/leadership-invitation-session";
import {
  renderLeadershipInvitationEmail,
  sendLeadershipInvitationEmail,
} from "@/lib/email/leadership-invitation-email";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("organization structure invitation", () => {
  it("normalizes the invited Google email and trims the sector fields", () => {
    expect(
      createOrganizationSectorInputSchema.parse({
        accessLevel: "admin",
        leaderEmail: "  Leader.Name@GMAIL.COM ",
        leaderPosition: "  Head de Copy  ",
        name: "  Copywriting  ",
      }),
    ).toEqual({
      accessLevel: "admin",
      leaderEmail: "leader.name@gmail.com",
      leaderPosition: "Head de Copy",
      name: "Copywriting",
    });
  });

  it("accepts only the exact invited Google email", () => {
    const invitation = {
      accessLevel: "admin" as const,
      companyName: "Directscal",
      expiresAt: "2026-09-02T12:00:00.000Z",
      leaderEmail: "leader.name@gmail.com",
      leaderPosition: "Head de Copy",
      sectorName: "Copywriting",
    };

    expect(
      resolvePendingLeadershipGoogleUser({
        email: "LEADER.NAME@gmail.com",
        invitation,
        name: "Líder Name",
        userEmail: "leader.name@gmail.com",
        userId: "46ed52bb-39c1-43f8-b6df-10b935710033",
      }),
    ).toMatchObject({
      company: "Directscal",
      email: "leader.name@gmail.com",
      name: "Líder Name",
      role: "admin",
    });

    expect(
      resolvePendingLeadershipGoogleUser({
        email: "leader.name@gmail.com",
        invitation: { ...invitation, accessLevel: "owner" },
        name: "Líder Name",
        userId: "46ed52bb-39c1-43f8-b6df-10b935710033",
      }),
    ).toMatchObject({ role: "cliente" });

    expect(
      resolvePendingLeadershipGoogleUser({
        email: "outra-conta@gmail.com",
        invitation,
        name: "Outra pessoa",
        userEmail: "outra-conta@gmail.com",
        userId: "46ed52bb-39c1-43f8-b6df-10b935710033",
      }),
    ).toBeNull();
  });

  it("renders a safe transactional email with a text alternative", () => {
    const email = renderLeadershipInvitationEmail({
      accessLevel: "owner",
      companyName: "Empresa <Teste>",
      invitationId: "invite-01",
      invitationUrl: "https://app.directscal.com/convites/lideranca/token",
      leaderEmail: "leader@gmail.com",
      leaderPosition: "Head de Copy",
      sectorName: "Copywriting & Conteúdo",
    });

    expect(email.subject).toContain("Copywriting & Conteúdo");
    expect(email.html).toContain("Empresa &lt;Teste&gt;");
    expect(email.html).toContain("Copywriting &amp; Conteúdo");
    expect(email.text).toContain("Acesso: Superadmin");
    expect(email.html).not.toContain("Empresa <Teste>");
    expect(email.text).toContain(
      "https://app.directscal.com/convites/lideranca/token",
    );
  });

  it("sends through Resend with an idempotency key tied to the invite", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("RESEND_FROM_EMAIL", "Directscal <convites@directscal.com>");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email-01" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendLeadershipInvitationEmail({
        accessLevel: "admin",
        companyName: "Directscal",
        invitationId: "invite-01",
        invitationUrl: "https://app.directscal.com/convites/lideranca/token",
        leaderEmail: "leader@gmail.com",
        leaderPosition: "Head de Copy",
        sectorName: "Copywriting",
      }),
    ).resolves.toEqual({ providerMessageId: "email-01" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": "leadership-invitation-invite-01",
        }),
        method: "POST",
      }),
    );
  });
});
