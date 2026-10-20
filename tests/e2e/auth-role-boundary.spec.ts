import { expect, test } from "@playwright/test";

test.skip(process.env.DIRECTSCAL_E2E_DEMO !== "true", "Exige ambiente demo isolado com login de desenvolvimento habilitado; não comprova OAuth real.");

test("superadmin remains inside the administrative surface", async ({ page }) => {
  const loginResponse = await page.request.post("/api/auth/login", {
    data: {
      email: "superadmin@directscal.com.br",
      password: "directscal123",
      remember: false,
    },
  });

  expect(loginResponse.status()).toBe(200);

  await page.addInitScript(() => {
    if (!window.localStorage.getItem("theme")) {
      window.localStorage.setItem("theme", "light");
    }
  });
  await page.goto("/omdx");

  await expect(page).toHaveURL(/\/admin\/operacao$/);
  await expect(page.locator('a[href="/admin/operacao"]').first()).toBeVisible();
  await expect(
    page.locator('a[href="/admin/campanhas"]').first(),
  ).toBeVisible();
  await expect(page.locator('a[href="/omdx"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pesquisas" })).toHaveCount(0);

  const customerApiResponse = await page.request.post("/api/omdx/diagnostics", {
    data: {},
  });

  expect(customerApiResponse.status()).toBe(403);

  for (const customerPath of ["/docs", "/action-points", "/insights", "/perfil"]) {
    await page.goto(customerPath);
    await expect(page).toHaveURL(/\/admin\/operacao$/);
  }

  await page.evaluate(() => window.localStorage.setItem("theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.evaluate(() => window.localStorage.setItem("theme", "light"));
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("client sidebar exposes the current navigation without requiring seeded content", async ({ page }) => {
  const loginResponse = await page.request.post("/api/auth/login", {
    data: { email: "cliente@directscal.com.br", password: "omdx12345", remember: false },
  });
  expect(loginResponse.status()).toBe(200);
  await page.goto("/omdx");
  await expect(page.getByRole("link", { name: "Pesquisas", exact: true })).toHaveAttribute("href", "/omdx/diagnosticos");
  await expect(page.getByRole("link", { name: "Analytics", exact: true })).toHaveAttribute("href", "/omdx");
  await expect(page.getByRole("link", { name: "Action Points", exact: true })).toHaveAttribute("href", "/action-points");
  await expect(page.getByText("Ativos de gestão", { exact: true })).toBeVisible();
  await expect(page.locator('a[href="/admin/operacao"]')).toHaveCount(0);
  // Bibliotecas por tipo continuam acessíveis por URL, sem duplicá-las na sidebar.
  await expect(page.getByRole("link", { name: "SOPs", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Playbooks", exact: true })).toHaveCount(0);
});
