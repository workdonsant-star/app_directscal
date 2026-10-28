import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/(app)/omdx/[id]/relatorio/route";
import { buildAcmeReportExample, acmeReportEditorial } from "@/lib/data/acme-report-example";
import { OmdxEditorialReportDocument } from "@/lib/pdf/omdx-editorial-report-document";
import { OmdxReportDocument } from "@/lib/pdf/omdx-report-document";

const mocks = vi.hoisted(() => ({ session: vi.fn(), access: vi.fn(), diagnostic: vi.fn(), publication: vi.fn(), report: vi.fn(), render: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: mocks.session }));
vi.mock("@/lib/auth/access-control", () => ({ canAccessCustomerApp: mocks.access }));
vi.mock("@/lib/data/omdx-data-source", () => ({ getDiagnosticById: mocks.diagnostic, getDiagnosticReport: mocks.report }));
vi.mock("@/lib/data/admin-delivery-data-source", () => ({ getAdminDeliveryPublication: mocks.publication }));
vi.mock("@react-pdf/renderer", async importOriginal => ({ ...await importOriginal<object>(), renderToBuffer: mocks.render }));

const report = buildAcmeReportExample();
const publication = { status: "publicada", diagnosticId: report.diagnostic.id, organizationId: report.diagnostic.organizationId, report: acmeReportEditorial };
const download = (query = "") => GET(new Request(`http://app.test/omdx/${report.diagnostic.id}/relatorio${query}`), { params: Promise.resolve({ id: report.diagnostic.id }) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "test-user", role: "cliente" } });
  mocks.access.mockReturnValue(true);
  mocks.diagnostic.mockResolvedValue(report.diagnostic);
  mocks.report.mockResolvedValue(report);
  mocks.publication.mockResolvedValue(publication);
  mocks.render.mockResolvedValue(Buffer.from("%PDF-1.3\nfixture"));
});

describe("download do relatório e dos dados", () => {
  it("exige sessão e papel de cliente antes de ler dados", async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await download()).status).toBe(401);
    mocks.access.mockReturnValueOnce(false);
    expect((await download()).status).toBe(403);
    expect(mocks.diagnostic).not.toHaveBeenCalled();
  });
  it.each([
    { ...publication, status: "rascunho" },
    { ...publication, organizationId: "outra-empresa" },
    { ...publication, diagnosticId: "outra-coleta" },
  ])("recusa publicação indisponível ou de outro contexto", async invalid => {
    mocks.publication.mockResolvedValue(invalid);
    expect((await download()).status).toBe(404);
    expect(mocks.render).not.toHaveBeenCalled();
  });
  it("o padrão gera o relatório editorial com a versão publicada", async () => {
    const response = await download();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Disposition")).toContain("relatorio-omdx-acme");
    expect(mocks.render.mock.calls[0][0]).toMatchObject({ type: OmdxEditorialReportDocument, props: { report, editorial: acmeReportEditorial } });
  });
  it("mantém o documento anterior em Dados da pesquisa", async () => {
    const response = await download("?conteudo=dados");
    expect(response.headers.get("Content-Disposition")).toContain("dados-omdx-acme");
    expect(mocks.render.mock.calls[0][0].type).toBe(OmdxReportDocument);
  });
  it("preserva o CSV sem renderizar PDF", async () => {
    const response = await download("?formato=csv");
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(await response.text()).toContain("Acme");
    expect(mocks.render).not.toHaveBeenCalled();
  });
  it("conserva as seis seções publicadas no relatório formatado", () => {
    const serialized = JSON.stringify(OmdxEditorialReportDocument({ report, editorial: acmeReportEditorial }));
    Object.values(acmeReportEditorial).forEach(text => expect(serialized).toContain(text));
  });
});
