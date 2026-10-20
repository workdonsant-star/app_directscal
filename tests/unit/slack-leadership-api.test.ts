import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/profile-data-source", () => ({ getProfileSettingsData: vi.fn() }));
vi.mock("@/lib/data/slack-leadership-data-source", () => ({ createSlackSectorLeader: vi.fn(), getSlackLeadershipDirectory: vi.fn() }));

import { POST } from "@/app/api/settings/sectors/route";
import { GET } from "@/app/api/settings/slack-users/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { createSlackSectorLeader, getSlackLeadershipDirectory } from "@/lib/data/slack-leadership-data-source";
import type { AuthSession } from "@/lib/contracts";

const session = { user: { id: "owner-1", role: "cliente" } } as AuthSession;
const input = { name: "Operações", slackUserId: "U123" };
const request = (body: unknown = input) => new Request("http://localhost/api/settings/sectors", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentAuthSession).mockResolvedValue(session);
  vi.mocked(getProfileSettingsData).mockResolvedValue({ organizationId: "org-1" } as Awaited<ReturnType<typeof getProfileSettingsData>>);
  vi.mocked(createSlackSectorLeader).mockResolvedValue({ sectorId: "sector-1" });
  vi.mocked(getSlackLeadershipDirectory).mockResolvedValue([{ userId: "U123", name: "Ana", avatarUrl: null, position: null }]);
});

describe("configuração de lideranças pelo Slack", () => {
  it("exige sessão antes de consultar Slack ou gravar", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(request())).status).toBe(401);
    expect(getSlackLeadershipDirectory).not.toHaveBeenCalled();
    expect(createSlackSectorLeader).not.toHaveBeenCalled();
  });
  it.each(["admin", "superadmin"] as const)("recusa papel %s", async (role) => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue({ ...session, user: { ...session.user, role } });
    expect((await GET()).status).toBe(403);
    expect((await POST(request())).status).toBe(403);
    expect(getProfileSettingsData).not.toHaveBeenCalled();
  });
  it.each(["acquisition", "leadershipInvitation"] as const)("recusa intent %s", async (intent) => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue({ ...session, [intent]: true });
    expect((await GET()).status).toBe(403);
    expect((await POST(request())).status).toBe(403);
  });
  it("lista o diretório da empresa da sessão com no-store", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getSlackLeadershipDirectory).toHaveBeenCalledWith("org-1");
    expect(await response.json()).toMatchObject({ users: [{ name: "Ana", position: null }] });
  });
  it("salva sem e-mail, senha, cargo ou nível de acesso", async () => {
    expect((await POST(request())).status).toBe(201);
    expect(createSlackSectorLeader).toHaveBeenCalledWith({ organizationId: "org-1", createdBy: "owner-1", input });
  });
  it.each([{ ...input, organizationId: "other-org" }, { ...input, accessLevel: "owner" }, { ...input, name: "" }, { ...input, leaderEmail: "fake@example.com" }])("rejeita payload inválido ou campos de identidade/acesso", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(createSlackSectorLeader).not.toHaveBeenCalled();
  });
  it("retorna falha de diretório sem dados internos nem resposta cacheada", async () => {
    vi.mocked(getSlackLeadershipDirectory).mockRejectedValue(new Error("secret-provider-detail"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).not.toContain("secret-provider-detail");
  });
});
