import { expect, test } from "@playwright/test";

test.skip(process.env.DIRECTSCAL_C2_UI_FIXTURE !== "true", "Requer rota temporária documentada; não comprova persistência nem entrega externa.");
const endpoint = "**/api/admin/companies/*/slack-deliveries*";
const date = "2026-10-26T12:00:00Z";
const job = (id: string, status: string, overrides = {}) => ({ id, eventId: id, source: "consulta", status, attempts: 1, retryable: false, nextAttemptAt: date, channel: "C_FIXTURE", messageTs: "1.0", deliveredTs: null, errorCode: null, receivedAt: date, updatedAt: date, ...overrides });
const jobs = [job("pending", "recebido"), job("processing", "processando"), job("done", "concluido", { deliveredTs: "2.0" }), job("ignored", "concluido"), job("retry", "falhou", { errorCode: "instalacao_indisponivel" }), job("automatic", "falhou", { retryable: true }), job("uncertain", "incerto")];

for (const theme of ["light", "dark"] as const) {
  test.describe(`C2 ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(value => localStorage.setItem("theme", value), theme);
      await page.route("**/api/**", route => route.fulfill({ status: 503, json: { message: "Serviço substituído pela fixture" } }));
      await page.route("**/api/admin/specialists", route => route.fulfill({ json: { specialists: [
        { id: "specialist_original", name: "Consultora original", title: "Consultora", status: "ativo", archived: false },
        { id: "specialist_new", name: "Novo consultor", title: "Consultor", status: "ativo", archived: false },
      ] } }));
    });
    test("atribuição preserva seleção em erro e contato da publicação", async ({ page }, testInfo) => {
      let fail = true;
      await page.route("**/api/admin/companies/company_*", async route => {
        if (fail) return route.fulfill({ status: 409, json: { message: "A atribuição mudou em outra sessão." } });
        const body = route.request().postDataJSON();
        expect(body.specialistId).toBe("specialist_new");
        await route.fulfill({ json: { assignment: { specialistId: body.specialistId, updatedAt: date } } });
      });
      await page.goto("/c2-review-fixture");
      await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
      await page.getByRole("combobox").click();
      await page.getByRole("option", { name: "Novo consultor" }).click();
      await page.getByRole("button", { name: "Salvar atribuição" }).click();
      await expect(page.locator("main").getByRole("alert")).toContainText("outra sessão");
      await expect(page.getByRole("combobox")).toContainText("Novo consultor");
      fail = false;
      await page.getByRole("button", { name: "Salvar atribuição" }).click();
      await expect(page.getByRole("status")).toContainText("Atribuição salva");
      await expect(page.getByRole("link", { name: "Contato", exact: true })).toHaveAttribute("href", "mailto:original@example.invalid");
      await expect(page.getByText("Diagnóstico encerrado de teste", { exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`company-${theme}.png`), fullPage: true });
    });
    test("fila preserva prazo ausente e filtra revisão vencida", async ({ page }, testInfo) => {
      await page.goto("/c2-review-fixture?view=assets");
      await expect(page.getByText("Definir periodicidade")).toBeVisible();
      await page.getByRole("tab", { name: /Revisão vencida/ }).click();
      await expect(page.getByText("SOP sem periodicidade", { exact: true })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Matriz de responsabilidades C2" })).toBeVisible();
      await expect(page.getByText("Operações", { exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`assets-${theme}.png`), fullPage: true });
    });
    test("RACI conserva conteúdo editável depois de falha", async ({ page }, testInfo) => {
      await page.goto("/c2-review-fixture?view=editor");
      await expect(page.locator(".tiptap")).toBeVisible();
      await expect(page.locator(".tiptap table")).toBeVisible();
      await page.getByLabel("Título", { exact: true }).fill("Matriz revisada localmente");
      await page.getByRole("button", { name: /Salvar/ }).click();
      await expect(page.getByText("Serviço substituído pela fixture")).toBeVisible();
      await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Matriz revisada localmente");
      await expect(page.locator(".tiptap table")).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`raci-${theme}.png`), fullPage: true });
    });
    test("Slack distingue estados e recupera apenas falha confirmada", async ({ page }, testInfo) => {
      let recovered = false;
      let postCount = 0;
      await page.route(endpoint, async route => {
        if (route.request().method() === "POST") {
          postCount++;
          expect(route.request().postDataJSON()).toEqual({ id: "retry", expectedUpdatedAt: date });
          recovered = true;
          return route.fulfill({ json: { message: "Entrega recolocada na fila." } });
        }
        return route.fulfill({ json: { items: jobs.map(item => item.id === "retry" && recovered ? { ...item, status: "recebido" } : item), nextCursor: null } });
      });
      await page.goto("/c2-review-fixture");
      await page.getByRole("button", { name: "Consultar entregas" }).click();
      await expect(page.getByRole("cell", { name: "Entregue", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Encerrado sem envio", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Recuperar entrega", exact: true })).toHaveCount(1);
      await expect(page.getByRole("row").filter({ hasText: "Incerto" }).getByRole("button")).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath(`slack-${theme}.png`), fullPage: true });
      await page.getByRole("button", { name: "Recuperar entrega", exact: true }).click();
      await page.getByRole("button", { name: "Causa corrigida, recuperar" }).click();
      await expect(page.getByRole("status")).toContainText("ainda não confirma o envio");
      await expect(page.getByRole("button", { name: "Recuperar entrega", exact: true })).toHaveCount(0);
      expect(postCount).toBe(1);
    });
    test("falha de consulta conserva lista e erro de recuperação exige releitura", async ({ page }) => {
      let failRead = false;
      await page.route(endpoint, route => route.fulfill(route.request().method() === "POST" ? { status: 409, json: { message: "A entrega mudou." } } : failRead ? { status: 503, json: { message: "Consulta indisponível." } } : { json: { items: [jobs[4]], nextCursor: null } }));
      await page.goto("/c2-review-fixture");
      await page.getByRole("button", { name: "Consultar entregas" }).click();
      await page.getByRole("button", { name: "Recuperar entrega", exact: true }).click();
      await page.getByRole("button", { name: "Causa corrigida, recuperar" }).click();
      await expect(page.locator("main").getByRole("alert")).toContainText("Atualize a lista");
      await expect(page.getByRole("button", { name: "Recuperar entrega", exact: true })).toBeDisabled();
      failRead = true;
      await page.getByRole("button", { name: "Atualizar", exact: true }).click();
      await expect(page.locator("main").getByRole("alert")).toContainText("Consulta indisponível");
      await expect(page.getByRole("cell", { name: "Falhou", exact: true })).toBeVisible();
      failRead = false;
      await page.getByRole("button", { name: "Atualizar", exact: true }).click();
      await expect(page.getByRole("button", { name: "Recuperar entrega", exact: true })).toBeEnabled();
    });
    test("Slack pagina sem perder linhas e distingue vazio de erro", async ({ page }) => {
      let empty = true;
      await page.route(endpoint, route => route.fulfill({ json: empty ? { items: [], nextCursor: null } : route.request().url().includes("cursor=") ? { items: [jobs[0], jobs[1]], nextCursor: null } : { items: [jobs[0]], nextCursor: "next-page" } }));
      await page.goto("/c2-review-fixture");
      await page.getByRole("button", { name: "Consultar entregas" }).click();
      await expect(page.getByText("Nenhuma entrega registrada para esta empresa.")).toBeVisible();
      empty = false;
      await page.getByRole("button", { name: "Atualizar", exact: true }).click();
      await page.getByRole("button", { name: "Carregar anteriores" }).click();
      await expect(page.getByRole("table", { name: "Entregas no Slack" }).getByRole("row")).toHaveCount(3);
      await expect(page.getByRole("button", { name: "Carregar anteriores" })).toHaveCount(0);
    });
    test("agente mostra fonte e feedback e distingue ausência de informação de falha", async ({ page }, testInfo) => {
      let questionCount = 0;
      let feedbackCount = 0;
      await page.route("**/api/assistant/ask", route => {
        questionCount++;
        if (questionCount === 3) return route.fulfill({ status: 503, json: { message: "Consulta temporariamente indisponível." } });
        return route.fulfill({ json: { answer: questionCount === 1 ? {
          answer: "A coordenação aprova o processo de teste.", status: "answered", auditId: "fixture-audit", citations: [{ chunkId: "fixture-chunk", title: "SOP de teste C2", section: "Aprovação", versionNumber: "2", publishedAt: date, href: "/ativos-de-gestao/sops/fixture-sop" }],
        } : { answer: "Não encontrei orientação publicada para esta pergunta.", status: "insufficient_evidence", auditId: "fixture-gap", citations: [] } } });
      });
      await page.route("**/api/assistant/feedback", route => { feedbackCount++; return route.fulfill({ json: { ok: true } }); });
      await page.goto("/c2-review-fixture?view=chat");
      await page.getByRole("textbox", { name: "Mensagem para o assistente" }).fill("Quem aprova o processo de teste?");
      await page.getByRole("button", { name: "Enviar mensagem" }).click();
      await expect(page.getByRole("link", { name: /SOP de teste C2/ })).toHaveAttribute("href", "/ativos-de-gestao/sops/fixture-sop");
      await expect(page.getByRole("link", { name: /SOP de teste C2/ })).toContainText("versão 2");
      await page.getByRole("button", { name: "Resposta útil", exact: true }).click();
      await expect(page.getByText("Obrigado pela avaliação.")).toBeVisible();
      await page.getByRole("textbox", { name: "Mensagem para o assistente" }).fill("Qual regra não documentada?");
      await page.getByRole("button", { name: "Enviar mensagem" }).click();
      await expect(page.getByText("Não encontrei orientação publicada para esta pergunta.")).toBeVisible();
      await page.getByRole("textbox", { name: "Mensagem para o assistente" }).fill("Consultar durante a falha de teste");
      await page.getByRole("button", { name: "Enviar mensagem" }).click();
      await expect(page.getByText("Consulta temporariamente indisponível.")).toBeVisible();
      await expect(page.getByRole("article").filter({ hasText: "Consulta temporariamente indisponível." }).getByRole("button")).toHaveCount(0);
      expect(feedbackCount).toBe(1);
      await page.screenshot({ path: testInfo.outputPath(`chat-${theme}.png`), fullPage: true });
    });
    test("leitor oferece consulta e guias usam os nomes atuais", async ({ page }, testInfo) => {
      await page.goto("/c2-review-fixture?view=reader");
      await expect(page.locator('a[href="/assistente"]').filter({ hasText: "Consultar agente" })).toHaveAttribute("href", "/assistente");
      await expect(page.getByText("SOP de teste C2", { exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`reader-${theme}.png`), fullPage: true });
      await page.goto("/c2-review-fixture?view=guide");
      await expect(page.getByRole("heading", { name: "Guia de operação", exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`guide-${theme}.png`), fullPage: true });
      await page.goto("/c2-review-fixture?view=guide&audience=customer");
      await expect(page.getByRole("link", { name: "Abrir Pesquisas" })).toHaveAttribute("href", "/omdx/diagnosticos");
      await expect(page.getByRole("link", { name: "Abrir Diagnósticos" })).toHaveAttribute("href", "/relatorios");
    });
  });
}
