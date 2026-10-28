import { expect, test } from "@playwright/test";

const recoveryCode = "00000000-0000-4000-8000-000000000001." + "a".repeat(43);

test("link de recuperação permanece utilizável após remover o fragmento", async ({ page }) => {
 await page.route("**/api/auth/reset-password/complete", route => route.fulfill({ status: 400, json: { message: "Link expirado ou já utilizado. Solicite outro." } }));
 await page.goto(`/recuperar-senha#codigo=${recoveryCode}`);
 await expect(page.getByLabel("Nova senha", { exact: true })).toBeVisible();
 await expect(page).toHaveURL(/\/recuperar-senha$/);
 await page.getByLabel("Nova senha", { exact: true }).fill("Senha fictícia de teste");
 await page.getByLabel("Confirme a nova senha").fill("Senha fictícia de teste");
 await page.getByRole("button", { name: "Salvar nova senha" }).click();
 await expect(page.locator('form [role="alert"]')).toHaveText("Link expirado ou já utilizado. Solicite outro.");
 await expect(page.getByLabel("Nova senha", { exact: true })).toHaveValue("Senha fictícia de teste");
 await page.getByRole("button", { name: "Link expirado ou indisponível? Solicitar outro" }).click();
 await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
});

test("falha de solicitação preserva e-mail e não confirma envio", async ({ page }) => {
 await page.route("**/api/auth/reset-password", route => route.fulfill({ status: 503, json: { message: "Recuperação indisponível. Tente novamente." } }));
 await page.goto("/recuperar-senha");
 await page.getByLabel("E-mail", { exact: true }).fill("teste@fixture.invalid");
 await page.getByRole("button", { name: "Enviar instruções" }).click();
 await expect(page.locator('form [role="alert"]')).toHaveText("Recuperação indisponível. Tente novamente.");
 await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue("teste@fixture.invalid");
 await expect(page.getByRole("status")).toHaveCount(0);
});

test("link malformado informa a falha e permite nova solicitação", async ({ page }) => {
 await page.goto("/recuperar-senha#codigo=incompleto");
 await expect(page.locator('form [role="alert"]')).toHaveText("Link de recuperação inválido. Solicite novas instruções.");
 await expect(page).toHaveURL(/\/recuperar-senha$/);
 await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
});
for (const theme of ["light", "dark"] as const) {
 for (const width of [1440, 375]) {
  test(`recuperação pública preserva formulário e responsividade ${theme} ${width}`, async ({ page }, testInfo) => {
   await page.setViewportSize({width, height: 900});
   await page.addInitScript(value => localStorage.setItem("theme", value), theme);
   await page.goto("/recuperar-senha");
   await expect(page.getByRole("heading", {name: "Recupere o acesso"})).toBeVisible();
   await expect(page.getByLabel("E-mail", {exact: true})).toBeVisible();
   await expect(page.getByRole("link", {name: "Voltar para entrada", exact: true})).toBeVisible();
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
   if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
   else await expect(page.locator("html")).not.toHaveClass(/dark/);
   await page.screenshot({ path: testInfo.outputPath(`recovery-${theme}-${width}.png`), fullPage: true });
   // Somente renderização: não solicitar e-mail nem trocar credencial real.
  });
 }
}
