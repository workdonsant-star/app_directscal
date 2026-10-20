import { expect, test } from "@playwright/test";
for (const theme of ["light", "dark"] as const) {
 for (const width of [1440, 375]) {
  test(`recuperação pública preserva formulário e responsividade ${theme} ${width}`, async ({ page }) => {
   await page.setViewportSize({width, height: 900});
   await page.addInitScript(value => localStorage.setItem("theme", value), theme);
   await page.goto("/recuperar-senha");
   await expect(page.getByRole("heading", {name: "Recupere o acesso"})).toBeVisible();
   await expect(page.getByLabel("E-mail", {exact: true})).toBeVisible();
   await expect(page.getByRole("link", {name: "Voltar para entrada", exact: true})).toBeVisible();
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
   if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
   else await expect(page.locator("html")).not.toHaveClass(/dark/);
   // Somente renderização: não solicitar e-mail nem trocar credencial real.
  });
 }
}
