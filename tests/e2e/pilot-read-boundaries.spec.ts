import { expect, test } from "@playwright/test";
// Estados devem vir de login normal do piloto em ambiente de teste. Não criar
// cookie privilegiado, reutilizar sessão de produção ou versionar esses arquivos.
const ownerState = process.env.DIRECTSCAL_E2E_OWNER_STATE;
const operatorState = process.env.DIRECTSCAL_E2E_OPERATOR_STATE;
const companyId = process.env.DIRECTSCAL_E2E_COMPANY_ID;
const foreignDiagnosticId = process.env.DIRECTSCAL_E2E_FOREIGN_DIAGNOSTIC_ID;

test.describe("piloto: leitura do cliente e isolamento", () => {
 test.use({ storageState: ownerState ?? { cookies: [], origins: [] } });
 test.skip(!ownerState || !foreignDiagnosticId || !companyId, "Exige sessão normal do cliente e fixtures conhecidas de duas empresas; ausência não é aprovação.");
 for (const theme of ["light", "dark"] as const) {
  test(`histórico próprio e bloqueio da operação (${theme})`, async ({ page }) => {
   await page.setViewportSize({width: 1440, height: 900});
   await page.addInitScript(value => localStorage.setItem("theme", value), theme);
   await page.goto("/assistente");
   await page.getByRole("button", {name: "Histórico de consultas", exact: true}).click();
   await expect(page.getByRole("heading", {name: "Suas consultas no app", exact: true})).toBeVisible();
   expect((await page.request.get("/api/assistant/history")).status()).toBe(200);
   expect((await page.request.post(`/api/admin/companies/${companyId}/agent-operations`, {data: {}})).status()).toBe(403);
   expect([403, 404]).toContain((await page.request.get(`/omdx/${foreignDiagnosticId}/relatorio`)).status());
   if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
   else await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
 }
});
test.describe("piloto: operação com escopo da empresa", () => {
 test.use({ storageState: operatorState ?? {cookies: [], origins: []} });
 test.skip(!operatorState || !companyId, "Exige login normal da operação e empresa de teste; não injeta sessão privilegiada.");
 for (const theme of ["light", "dark"] as const) {
  test(`lacunas, bases e fronteira cliente (${theme})`, async ({ page }) => {
   await page.setViewportSize({width: 1440, height: 900});
   await page.addInitScript(value => localStorage.setItem("theme", value), theme);
   await page.goto(`/admin/empresas/${companyId}/criacao-dos-ativos/perguntas`);
   await expect(page.getByRole("heading", {name: "Perguntas ao agente", exact: true})).toBeVisible();
   await expect(page.getByRole("region", {name: "Saúde operacional da empresa"})).toBeVisible();
   await page.goto(`/admin/empresas/${companyId}/rotinas`);
   await expect(page.getByRole("heading", {name: "Base de resultado", exact: true})).toBeVisible();
   await expect(page.getByRole("heading", {name: "Revisão e intervenção", exact: true})).toBeVisible();
   expect((await page.request.get("/api/assistant/history")).status()).toBe(403);
   if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
   else await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
 }
});
