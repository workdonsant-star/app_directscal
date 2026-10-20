import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ getAccessibleOrganizationIdsForUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getOwnAssistantHistory } from "@/lib/data/assistant-history-data-source";
import { GET } from "@/app/api/assistant/history/route";
import type { AuthSession } from "@/lib/contracts/auth";
const id = "00000000-0000-4000-8000-000000000001", org = "00000000-0000-4000-8000-000000000002";
const session: AuthSession = { token: "fixture", supabaseAccessToken: "fixture", user: { id, role: "cliente", name: "Pessoa", email: "p@fixture.invalid", company: "Fixture" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const eq = vi.fn(), order = vi.fn(), limit = vi.fn(), or = vi.fn();
let rows: Array<{id: string; question: string; answer: string; answer_status: string; created_at: string; citations: never[]}>;
const query = { eq, order, limit, or, then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve) };
beforeEach(() => {
 vi.clearAllMocks(); rows = []; for (const fn of [eq, order, limit, or]) fn.mockReturnValue(query);
 vi.mocked(getCurrentAuthSession).mockResolvedValue(session);
 vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, primaryOrganizationId: org, organizationIds: [org] });
 vi.mocked(createSupabaseAdminClient).mockReturnValue({ from: () => ({ select: () => query }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
});
describe("histórico pessoal de consultas", () => {
 it("nega global/temporária/sem sessão e não consulta dados", async () => {
  for (const candidate of [null, { ...session, user: { ...session.user, role: "superadmin" as const } }, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }]) {
   vi.mocked(getCurrentAuthSession).mockResolvedValue(candidate); expect((await GET(new Request("https://fixture.invalid"))).status).toBe(candidate ? 403 : 401);
  }
  expect(eq).not.toHaveBeenCalled();
 });
 it("recusa escolha de usuário/empresa e cursor adulterado", async () => {
  expect((await GET(new Request(`https://fixture.invalid?userId=${id}`))).status).toBe(400);
  expect((await GET(new Request("https://fixture.invalid?cursor=invalido"))).status).toBe(400);
  expect(eq).not.toHaveBeenCalled();
 });
 it("aplica empresa atual, pessoa e canal; pagina por data e id sem refazer conversa", async () => {
  rows = Array.from({ length: 26 }, (_, index) => ({ id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, question: "Como operar?", answer: "Confira a fonte", answer_status: "respondida", created_at: "2026-10-20T12:00:00.123456Z", citations: [] }));
  const first = await getOwnAssistantHistory(); expect(first.items).toHaveLength(25); expect(first.nextCursor).toBeTruthy();
  expect(eq).toHaveBeenCalledWith("organization_id", org); expect(eq).toHaveBeenCalledWith("user_id", id); expect(eq).toHaveBeenCalledWith("channel", "app");
  await getOwnAssistantHistory(first.nextCursor!); expect(or).toHaveBeenCalledWith(expect.stringContaining("2026-10-20T12:00:00.123456Z"));
 });
});
