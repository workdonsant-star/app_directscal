import { expect, test } from "@playwright/test";
import { buildInitialReport } from "../../src/components/admin/delivery/delivery-draft";

test.skip(process.env.DIRECTSCAL_C1_UI_FIXTURE !== "true", "Requer rota temporária documentada em fixtures/CLAUDE.md; esta suíte não comprova persistência ou autenticação.");

for (const theme of ["light", "dark"] as const) {
 test.describe(`C1 ${theme}`, () => {
  test.beforeEach(async ({ page }) => {
   await page.setViewportSize({ width: 1440, height: 1000 });
   await page.emulateMedia({ reducedMotion: "reduce" });
   await page.addInitScript(value => localStorage.setItem("theme", value), theme);
   await page.route("**/api/**", route => route.fulfill({ status: 503, json: { message: "Serviço substituído pela fixture" } }));
   await page.route("**/api/admin/specialists", route => route.fulfill({ json: { specialists: [{ id: "specialist_fixture", name: "Consultor de teste", status: "ativo", archived: false }] } }));
  });
  test("Analytics distingue percepção, consulta e execução e preserva coleta ao navegar", async ({ page }, testInfo) => {
   await page.goto("/c1-review-fixture?view=analytics");
   await expect(page.getByRole("heading", { name: "Percepção e acompanhamento" })).toBeVisible();
   await expect(page.getByRole("meter", { name: "Média das percepções" })).toBeVisible();
   await expect(page.getByRole("heading", { name: "Respostas por nível" })).toBeVisible();
   await expect(page.getByText("OMDx v1 · versão original")).toHaveCount(0);
   await expect(page.locator("a").filter({ hasText: "Abrir action points" })).toHaveAttribute("href", "/action-points?diagnostico=analytics-example-1");
   await expect(page.getByText("Maturidade geral", { exact: true })).toHaveCount(0);
   await expect(page.getByText("Consultas aos ativos: sem dados disponíveis.")).toBeVisible();
   await page.getByRole("combobox").focus();
   await page.keyboard.press("Enter");
   await expect(page.getByRole("option", { name: "Todos os diagnósticos" })).toHaveCount(0);
   await page.getByRole("option").first().click();
   await expect(page).toHaveURL(/diagnostico=analytics-example-0/);
   await expect(page.locator("a").filter({ hasText: "Abrir action points" })).toHaveAttribute("href", "/action-points?diagnostico=analytics-example-0");
   await page.screenshot({ path: testInfo.outputPath(`analytics-${theme}.png`), fullPage: true });
  });
  test("entrega nova permite editar ou descartar o texto inicial", async ({ page }) => {
   await page.goto("/c1-review-fixture?new=true");
   await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
   const summary = page.getByLabel("Resumo executivo", { exact: true });
   const initial = await summary.inputValue();
   expect(initial.length).toBeGreaterThan(20);
   await summary.fill("");
   await expect(page.getByRole("button", { name: "Publicar entrega", exact: true })).toBeDisabled();
   await summary.fill("Análise escrita pelo consultor após conferir os dados desta coleta.");
   await expect(page.getByRole("button", { name: "Publicar entrega", exact: true })).toBeEnabled();
   await page.getByRole("button", { name: "Fixture: prévia" }).click();
   await expect(page.getByText("Análise escrita pelo consultor após conferir os dados desta coleta.", { exact: true })).toBeVisible();
   await expect(page.getByText(initial, { exact: true })).toHaveCount(0);
  });
  test("editor preserva texto após falha, mostra prévia completa e permite republicar", async ({ page }, testInfo) => {
   let failure = true;
   let payload: Record<string, unknown> = {};
   await page.route("**/api/admin/deliveries/*", async route => {
    payload = route.request().postDataJSON();
    if (failure) return route.fulfill({ status: 503, body: "indisponível" });
    return route.fulfill({ json: { publication: { ...payload, status: payload.intent === "publish" ? "publicada" : "em_analise" } } });
   });
   await page.goto("/c1-review-fixture");
   await expect(page.getByRole("button", { name: "Publicado", exact: true })).toBeDisabled();
   const edited = "Leitura revisada pelo consultor, preservada durante falhas de salvamento.";
   await page.getByLabel("Resumo executivo", { exact: true }).fill(edited);
   await expect(page.getByText("Alterações não salvas")).toBeVisible();
   await expect(page.getByRole("button", { name: "Publicar entrega", exact: true })).toBeEnabled();
   await page.getByRole("button", { name: "Salvar rascunho" }).click();
   await expect(page.getByRole("alert").filter({ hasText: "Sua redação foi preservada" })).toBeVisible();
   await expect(page.getByLabel("Resumo executivo", { exact: true })).toHaveValue(edited);
   failure = false;
   await page.getByRole("button", { name: "Salvar rascunho" }).click();
   await expect(page.getByText("Rascunho salvo.", { exact: true })).toBeVisible();
   expect(payload.intent).toBe("save");
   await expect(page.getByText("Alterações não salvas")).toHaveCount(0);
   await page.getByRole("button", { name: "Fixture: prévia" }).click();
   for (const title of ["Resumo executivo", "Leitura geral", "Vulnerabilidades prioritárias", "Causas estruturais", "Recomendações", "Conclusão"]) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
   }
   await expect(page.getByText(edited, { exact: true })).toBeVisible();
   await expect(page.getByText("Mapear os processos críticos da operação", { exact: true })).toBeVisible();
   await page.getByRole("button", { name: "Publicar entrega", exact: true }).click();
   await expect(page.getByText("Entrega publicada. O relatório já está disponível para o cliente.")).toBeVisible();
   expect(payload.intent).toBe("publish");
   expect((payload.report as Record<string, string>).executiveSummary).toBe(edited);
   await page.screenshot({ path: testInfo.outputPath(`editor-${theme}.png`), fullPage: true });
  });
  test("relatório nativo conserva as seis seções editoriais", async ({ page }, testInfo) => {
   await page.goto("/c1-review-fixture?view=report");
   await expect(page.getByRole("article")).toBeVisible();
   for (const text of Object.values(buildInitialReport("Empresa fictícia C1"))) {
    await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
   }
   await page.screenshot({ path: testInfo.outputPath(`report-${theme}.png`), fullPage: true });
  });
  test("aviso da pesquisa é legível em 375px", async ({ page }, testInfo) => {
   await page.setViewportSize({ width: 375, height: 900 });
   await page.goto("/c1-review-fixture?view=response");
   await expect(page.getByText(/Grupos pequenos e a percepção do fundador/)).toBeVisible();
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
   await page.screenshot({ path: testInfo.outputPath(`response-${theme}.png`), animations: "disabled" });
  });
  test("ação publicada mantém origem e distingue atribuição e medição", async ({ page }, testInfo) => {
   await page.goto("/c1-review-fixture?view=actions");
   await expect(page.getByRole("link", { name: "Voltar ao relatório desta coleta" })).toHaveAttribute("href", "/relatorios/analytics-example-1");
   await expect(page.getByText("Sem medição", { exact: true })).toBeVisible();
   await page.getByRole("button", { name: /Sem responsável/ }).click();
   await page.getByRole("button", { name: "Mapear os processos críticos da operação" }).click();
   await expect(page.getByRole("dialog")).toBeVisible();
   await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
   await expect(page.getByRole("dialog").getByText("Prazo acordado")).toBeVisible();
   await expect(page.getByRole("dialog").getByText("Não definido", { exact: true })).toBeVisible();
   await expect(page.getByRole("dialog").getByText("Não informado", { exact: true })).toBeVisible();
   await page.screenshot({ path: testInfo.outputPath(`action-${theme}.png`), animations: "disabled" });
  });
 });
}
