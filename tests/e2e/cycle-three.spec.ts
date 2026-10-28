import { expect, test } from "@playwright/test";
import { routineWorkspace } from "./fixtures/cycle-three-workspace";

test.skip(process.env.DIRECTSCAL_C3_UI_FIXTURE !== "true", "Requer a rota temporária de fixtures C3.");
const users = [{ userId: "U_ORIGINAL", name: "Ana de teste", teamId: "T_FIXTURE" }, { userId: "U_NEW", name: "Bruno de teste", teamId: "T_FIXTURE" }];
for (const theme of ["light", "dark"] as const) {
  test.describe(`C3 ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(value => localStorage.setItem("theme", value), theme);
      await page.route("**/api/**", route => route.fulfill({ status: 503, json: { message: "Serviço substituído" } }));
    });
    test("diretório falho descarta pessoas antigas e preserva o formulário", async ({ page }, testInfo) => {
      let directoryFails = false;
      let posts = 0;
      await page.route("**/routines?directory=1", route => route.fulfill(directoryFails ? { status: 502, json: { message: "Diretório indisponível" } } : { json: { users } }));
      await page.route("**/routines", route => { posts++; return route.fulfill({ status: 409, json: { message: "Conflito" } }); });
      await page.goto("/c3-review-fixture");
      await expect(page.locator("[data-hydrated]")).toHaveAttribute("data-hydrated", "true");
      await page.getByRole("button", { name: "Editar", exact: true }).click();
      await page.getByLabel("Motivo da revisão").fill("Texto preservado");
      await expect(page.getByRole("button", { name: "Salvar revisão" })).toBeEnabled();
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      directoryFails = true;
      await page.getByRole("button", { name: "Editar", exact: true }).click();
      await expect(page.getByText("Diretório indisponível", { exact: true })).toBeVisible();
      await page.getByLabel("Motivo da revisão").fill("Preservar esta revisão");
      await expect(page.getByRole("button", { name: "Salvar revisão" })).toBeDisabled();
      await page.screenshot({ path: testInfo.outputPath(`directory-${theme}.png`), fullPage: true });
      directoryFails = false;
      await page.getByRole("button", { name: "Tentar novamente" }).click();
      await expect(page.getByRole("button", { name: "Salvar revisão" })).toBeEnabled();
      await expect(page.getByLabel("Motivo da revisão")).toHaveValue("Preservar esta revisão");
      expect(posts).toBe(0);
    });
    test("salvamento confirmado exige releitura antes de nova mutação", async ({ page }, testInfo) => {
      let readFails = true;
      let writes = 0;
      await page.route("**/routines", route => {
        if (route.request().method() === "POST") { writes++; return route.fulfill({ json: { ok: true } }); }
        return route.fulfill(readFails ? { status: 503, json: {} } : { json: { workspace: routineWorkspace } });
      });
      await page.goto("/c3-review-fixture");
      await page.getByRole("button", { name: "Pausar", exact: true }).click();
      await page.getByLabel("Motivo da mudança").fill("Pausa de teste");
      await page.getByRole("button", { name: "Confirmar mudança" }).click();
      await expect(page.getByRole("main").getByText(/A alteração foi gravada, mas a lista não carregou/)).toBeVisible();
      for (const name of ["Nova rotina", "Editar", "Pausar", "Transferir responsável"]) await expect(page.getByRole("button", { name, exact: true })).toBeDisabled();
      await page.getByRole("button", { name: "Atualizar dados" }).click();
      await expect(page.getByRole("main").getByText(/A lista anterior foi mantida/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeDisabled();
      await page.screenshot({ path: testInfo.outputPath(`refresh-${theme}.png`), fullPage: true });
      readFails = false;
      await page.getByRole("button", { name: "Atualizar dados" }).click();
      await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeEnabled();
      expect(writes).toBe(1);
    });
    test("responsável removido não pode salvar e transferência usa diretório atual", async ({ page }, testInfo) => {
      let available = users;
      await page.route("**/routines", route => {
        const input = route.request().postDataJSON();
        expect(input.operation).toBe("transferir");
        expect(input.assigneeUserId).toBe("U_NEW");
        expect(input.expectedRules).toEqual([{ routineId: routineWorkspace.rules[0].routineId, ruleId: routineWorkspace.rules[0].id }]);
        return route.fulfill({ status: 409, json: { message: "A atribuição mudou em outra sessão." } });
      });
      await page.route("**/routines?directory=1", route => route.fulfill({ json: { users: available } }));
      await page.goto("/c3-review-fixture");
      available = [users[1]];
      await page.getByRole("button", { name: "Editar", exact: true }).click();
      await expect(page.getByText(/O responsável atual não está disponível/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Salvar revisão" })).toBeDisabled();
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      await page.getByRole("button", { name: "Transferir responsável", exact: true }).click();
      await page.getByRole("combobox", { name: "Novo responsável no Slack" }).click();
      await page.getByRole("option", { name: "Bruno de teste" }).click();
      await page.getByLabel("Motivo da mudança").fill("Transferir a rotina");
      await expect(page.getByRole("button", { name: "Confirmar mudança" })).toBeEnabled();
      await page.getByRole("button", { name: "Confirmar mudança" }).click();
      await expect(page.getByText("A atribuição mudou em outra sessão.", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Motivo da mudança")).toHaveValue("Transferir a rotina");
      await expect(page.getByRole("combobox", { name: "Novo responsável no Slack" })).toContainText("Bruno de teste");
      await page.screenshot({ path: testInfo.outputPath(`transfer-${theme}.png`), fullPage: true });
    });
    test("pré-requisitos de criação aparecem junto à página", async ({ page }, testInfo) => {
      await page.goto("/c3-review-fixture?empty=1");
      await expect(page.getByRole("button", { name: "Nova rotina" })).toBeDisabled();
      await expect(page.getByText("Para criar uma rotina, esta empresa precisa de um action point publicado, um ativo publicado, um setor ativo.")).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`empty-${theme}.png`), fullPage: true });
    });
  });
}
