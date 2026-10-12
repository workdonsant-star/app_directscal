import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/management-assets-data-source", () => ({ getManagementAssetDocument: vi.fn() }));

import { GET } from "@/app/(app)/ativos-de-gestao/download/[type]/[id]/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getManagementAssetDocument } from "@/lib/data/management-assets-data-source";

const session = { user: { id: "user-test", role: "cliente" } };
const request = new Request("http://localhost/ativos-de-gestao/download/sop/test");
const context = (type = "sop") => ({ params: Promise.resolve({ type, id: "test" }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentAuthSession).mockResolvedValue(session as Awaited<ReturnType<typeof getCurrentAuthSession>>);
  vi.mocked(getManagementAssetDocument).mockResolvedValue(null);
});

describe("download do ativo publicado", () => {
  it("exige sessão sem consultar conteúdo", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(null);
    expect((await GET(request, context())).status).toBe(401);
    expect(getManagementAssetDocument).not.toHaveBeenCalled();
  });
  it("recusa superadmin sem consultar conteúdo", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { ...session.user, role: "superadmin" } } as Awaited<ReturnType<typeof getCurrentAuthSession>>);
    expect((await GET(request, context())).status).toBe(403);
    expect(getManagementAssetDocument).not.toHaveBeenCalled();
  });
  it("recusa tipo inválido e ativo sem leitura autorizada", async () => {
    expect((await GET(request, context("invalido"))).status).toBe(404);
    expect(getManagementAssetDocument).not.toHaveBeenCalled();
    expect((await GET(request, context())).status).toBe(404);
  });
  it.each(["sop", "playbook", "governanca", "raci"])("baixa %s com nome seguro e sem cache", async (type) => {
    vi.mocked(getManagementAssetDocument).mockResolvedValue({ title: 'Gestão / "Equipe"\r\n', type, summary: "Descrição", operationalOwner: "Liderança", versionNumber: "1.0", reviewCycle: "Trimestral", author: { name: "Directscal" }, updatedAt: "2026-10-09T12:00:00Z", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Conteúdo publicado." }] }] } } as NonNullable<Awaited<ReturnType<typeof getManagementAssetDocument>>>);
    const response = await GET(request, context(type));
    expect(response.status).toBe(200);
    expect(getManagementAssetDocument).toHaveBeenCalledWith(type, "test");
    expect(response.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="gestao-equipe.md"');
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.text();
    expect(body).toMatch(/^# Gestão/);
    expect(body).toContain("Conteúdo publicado\\.");
    expect(Number(response.headers.get("Content-Length"))).toBe(Buffer.byteLength(body, "utf8"));
  });
});
