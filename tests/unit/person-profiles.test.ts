import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/person-profiles-data-source", () => ({ saveAccountProfile: vi.fn(), mutateSpecialist: vi.fn(), getSpecialists: vi.fn() }));
vi.mock("@/lib/data/profile-data-source", () => ({ getProfileSettingsData: vi.fn(), updateOrganizationPersonPosition: vi.fn(), updateProfileCommercialData: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { saveAccountProfile, mutateSpecialist } from "@/lib/data/person-profiles-data-source";
import { personalProfileInputSchema } from "@/lib/contracts/profile";
import { PUT } from "@/app/api/profile/route";
import { PATCH, POST } from "@/app/api/admin/specialists/route";
const request = (body: unknown) => new Request("http://localhost/api/profile", { method: "PUT", body: JSON.stringify(body) });
const session = (role: "cliente" | "superadmin") => ({ user: { id: "actor", name: "Pessoa", email: "person@example.invalid", role } }) as Awaited<ReturnType<typeof getCurrentAuthSession>>;
beforeEach(() => { vi.resetAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session("cliente")); });
describe("persistência pessoal", () => {
  it("bloqueia escrita sem sessão", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(null);
    expect((await PUT(request({ name: "Teste", avatarUrl: null }))).status).toBe(401);
    expect(saveAccountProfile).not.toHaveBeenCalled();
  });
  it("deriva identidade da sessão e confirma gravação antes de retornar sucesso", async () => {
    vi.mocked(saveAccountProfile).mockResolvedValue({ name: "Atualizado", avatarUrl: null, profilePersisted: true });
    expect((await PUT(request({ name: "Atualizado", avatarUrl: null }))).status).toBe(200);
    expect(saveAccountProfile).toHaveBeenCalledWith("actor", { name: "Atualizado", avatarUrl: null });
    vi.mocked(saveAccountProfile).mockRejectedValue(new Error("private database details"));
    const response = await PUT(request({ name: "Atualizado", avatarUrl: null }));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private database");
  });
  it("recusa trocar conta e fotos locais ou formatos executáveis", async () => {
    expect((await PUT(request({ userId: "victim", name: "Teste", avatarUrl: null }))).status).toBe(400);
    for (const avatarUrl of ["blob:local", "data:image/svg+xml;base64,PHN2Zz4=", "javascript:alert(1)", "//external.test/photo", "data:image/png;base64," + "a".repeat(1_000_001)]) {
      expect(personalProfileInputSchema.safeParse({ name: "Pessoa", avatarUrl }).success).toBe(false);
    }
    expect(saveAccountProfile).not.toHaveBeenCalled();
  });
});
describe("cadastro compartilhado de especialistas", () => {
  it("bloqueia clientes antes da mutação", async () => {
    expect((await PATCH(request({ id: "specialist", name: "Outro nome" }))).status).toBe(403);
    expect(mutateSpecialist).not.toHaveBeenCalled();
  });
  it("persiste nome e remoção explícita de foto pelo superadmin", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(session("superadmin"));
    expect((await PATCH(request({ id: "specialist", name: "Outro nome", avatarUrl: null }))).status).toBe(200);
    expect(mutateSpecialist).toHaveBeenCalledWith({ id: "specialist", name: "Outro nome", avatarUrl: null }, false);
  });
  it("recusa campos de permissão no cadastro", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(session("superadmin"));
    expect((await POST(request({ name: "Pessoa", email: "person@example.invalid", title: "Área", location: "Cidade", role: "superadmin" }))).status).toBe(400);
    expect(mutateSpecialist).not.toHaveBeenCalled();
  });
});
