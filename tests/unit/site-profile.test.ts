import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { GET, OPTIONS } from "@/app/api/auth/site-profile/route";

const readSession = vi.mocked(getCurrentAuthSession);
const session = {
  token: "private-token",
  supabaseAccessToken: "private-database-token",
  user: { id: "private-id", name: "Marina Alves", email: "marina@example.test", company: "Example", role: "cliente" as const, avatarUrl: "https://example.test/avatar.png" },
  createdAt: "2026-01-01T00:00:00Z",
  expiresAt: "2099-01-01T00:00:00Z",
};
const request = (origin?: string) => new Request("https://app.directscal.com/api/auth/site-profile", { headers: origin ? { Origin: origin } : {} });

beforeEach(() => { vi.resetAllMocks(); readSession.mockResolvedValue(session); });
describe("website profile boundary", () => {
  it.each(["https://directscal.com", "https://www.directscal.com"])("returns only display data to %s", async (origin) => {
    const response = await GET(request(origin));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: { name: session.user.name, avatarUrl: session.user.avatarUrl } });
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("vary")).toBe("Origin, Cookie");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it.each([undefined, "null", "http://directscal.com", "https://evil.example", "https://directscal.com.evil.example", "https://preview.vercel.app", "http://localhost:8080"])("rejects untrusted origin %s before reading identity", async (origin) => {
    for (const response of [await GET(request(origin)), OPTIONS(request(origin))]) {
      expect(response.status).toBe(403);
      expect(response.headers.has("access-control-allow-origin")).toBe(false);
      expect(response.headers.get("cache-control")).toContain("no-store");
    }
    expect(readSession).not.toHaveBeenCalled();
  });
  it.each([null, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }, { ...session, expiresAt: "2000-01-01T00:00:00Z" }, { ...session, expiresAt: "invalid" }])("hides absent, provisional and expired identities", async (value) => {
    readSession.mockResolvedValue(value);
    const response = await GET(request("https://directscal.com"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: null });
  });
  it("preserves an explicitly removed photo and supports all definitive roles", async () => {
    for (const role of ["cliente", "admin", "superadmin"] as const) {
      readSession.mockResolvedValue({ ...session, user: { ...session.user, role, avatarUrl: null } });
      expect(await (await GET(request("https://directscal.com"))).json()).toEqual({ user: { name: "Marina Alves", avatarUrl: null } });
    }
  });
  it("returns a safe failure with CORS and no cache", async () => {
    readSession.mockRejectedValue(new Error("sensitive database details"));
    const response = await GET(request("https://directscal.com"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ user: null });
    expect(response.headers.get("access-control-allow-origin")).toBe("https://directscal.com");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("handles preflight without reading the session", () => {
    const response = OPTIONS(request("https://directscal.com"));
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toBe("GET, OPTIONS");
    expect(readSession).not.toHaveBeenCalled();
  });
});
