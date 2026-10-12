import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`perfil ignora identidade local antiga antes da primeira gravação (${theme})`, async ({ page }) => {
    const login = await page.request.post("/api/auth/login", {
      data: { email: "cliente@directscal.com.br", password: "omdx12345", remember: false },
    });
    expect(login.status()).toBe(200);
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
      localStorage.setItem("directscal:user-profile-overrides:user_cliente", JSON.stringify({
        name: "Outra pessoa do navegador",
        avatarUrl: "https://example.invalid/foto-antiga.png",
      }));
    }, theme);
    await page.goto("/perfil");
    await expect(page.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue("Marina Lopes");
    await expect(page.getByRole("button", { name: "Abrir menu de Marina Lopes" })).toBeVisible();
    await expect(page.locator('img[src="https://example.invalid/foto-antiga.png"]')).toHaveCount(0);
    if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
    else await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
}
