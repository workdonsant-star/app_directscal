import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ getAccessibleOrganizationIdsForUser: vi.fn() }));
vi.mock("@/lib/data/customer-documents-data-source", () => ({ getCustomerDocument: vi.fn(), downloadCustomerDocument: vi.fn() }));

import { GET } from "@/app/api/customer-documents/[id]/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCustomerDocument, downloadCustomerDocument } from "@/lib/data/customer-documents-data-source";

const request = new Request("http://localhost/api/customer-documents/file-id");
const context = { params: Promise.resolve({ id: "file-id" }) };
const document = { id: "file-id", organization_id: "org-a", file_name: "Relatório.pdf", mime_type: "application/pdf", storage_path: "org-a/file-id.pdf" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { id: "user-a", role: "cliente" } } as Awaited<ReturnType<typeof getCurrentAuthSession>>);
  vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, organizationIds: ["org-a"], primaryOrganizationId: "org-a" });
  vi.mocked(getCustomerDocument).mockResolvedValue(document as Awaited<ReturnType<typeof getCustomerDocument>>);
  vi.mocked(downloadCustomerDocument).mockResolvedValue(new Blob(["%PDF-test"], { type: "application/pdf" }));
});

describe("download de arquivo da empresa", () => {
  it("exige sessão antes de consultar metadados", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(null);
    expect((await GET(request, context)).status).toBe(401);
    expect(getCustomerDocument).not.toHaveBeenCalled();
  });

  it("não baixa arquivo de outra empresa", async () => {
    vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, organizationIds: ["org-b"], primaryOrganizationId: "org-b" });
    expect((await GET(request, context)).status).toBe(404);
    expect(downloadCustomerDocument).not.toHaveBeenCalled();
  });

  it("baixa arquivo da própria empresa sem expor o caminho privado", async () => {
    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Disposition")).toContain("attachment;");
    expect(response.headers.get("Content-Disposition")).not.toContain("org-a/");
    expect(await response.text()).toBe("%PDF-test");
  });
});
