import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/client-onboarding-data-source", () => ({ completeClientOnboarding: vi.fn() }));

import { POST } from "@/app/api/settings/onboarding/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { completeClientOnboarding } from "@/lib/data/client-onboarding-data-source";
import type { AuthSession } from "@/lib/contracts";

const session = { user: { id: "owner-test", role: "cliente" } } as AuthSession;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentAuthSession).mockResolvedValue(session);
  vi.mocked(completeClientOnboarding).mockResolvedValue({ ok: true });
});

describe("concluir onboarding", () => {
  it("exige sessão antes de consultar a empresa", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(null);
    expect((await POST()).status).toBe(401);
    expect(completeClientOnboarding).not.toHaveBeenCalled();
  });
  it.each(["admin", "superadmin"] as const)("recusa papel %s", async (role) => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue({ ...session, user: { ...session.user, role } });
    expect((await POST()).status).toBe(403);
    expect(completeClientOnboarding).not.toHaveBeenCalled();
  });
  it.each(["acquisition", "leadershipInvitation"] as const)("recusa sessão temporária %s", async (intent) => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue({ ...session, [intent]: true });
    expect((await POST()).status).toBe(403);
    expect(completeClientOnboarding).not.toHaveBeenCalled();
  });
  it("revalida a sessão no servidor e devolve conflito para progresso incompleto", async () => {
    vi.mocked(completeClientOnboarding).mockResolvedValue({ ok: false, message: "Conecte o Slack." });
    const response = await POST();
    expect(response.status).toBe(409);
    expect(completeClientOnboarding).toHaveBeenCalledWith(session);
  });
  it("confirma a conclusão somente após a gravação", async () => {
    const response = await POST();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
  it("trata falhas de infraestrutura sem vazar detalhes", async () => {
    vi.mocked(completeClientOnboarding).mockRejectedValue(new Error("internal database details"));
    const response = await POST();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("internal database details");
  });
});
