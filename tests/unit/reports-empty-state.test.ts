import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  access: vi.fn(),
  diagnostics: vi.fn(),
  publishedIds: vi.fn(),
  documents: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: mocks.session }));
vi.mock("@/lib/auth/access-control", () => ({ canAccessCustomerApp: mocks.access }));
vi.mock("@/lib/data/omdx-data-source", () => ({ getOmdxOverviewDiagnosticOptions: mocks.diagnostics }));
vi.mock("@/lib/data/admin-delivery-data-source", () => ({ getPublishedDiagnosticIds: mocks.publishedIds }));
vi.mock("@/lib/data/customer-documents-data-source", () => ({ listCustomerDocumentsForUser: mocks.documents }));
vi.mock("@/components/app-topbar", () => ({ AppTopbar: () => null }));

import ReportsPage from "@/app/(app)/relatorios/page";

describe("relatórios de uma conta nova", () => {
  it("mostra o estado vazio sem acrescentar um relatório fictício", async () => {
    mocks.session.mockResolvedValue({ user: { id: "novo-cliente", role: "cliente" } });
    mocks.access.mockReturnValue(true);
    mocks.diagnostics.mockResolvedValue([]);
    mocks.publishedIds.mockResolvedValue(new Set());
    mocks.documents.mockResolvedValue([]);

    const html = renderToStaticMarkup(await ReportsPage());

    expect(html).toContain("Nenhum relatório disponível");
    expect(html).not.toContain("Acme");
    expect(mocks.publishedIds).toHaveBeenCalledWith([]);
  });
});
