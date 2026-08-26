import { expect, test } from "@playwright/test";

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

  await expect(page).toHaveURL(/\/admin\/modulos$/);
  await expect(page.locator('a[href="/admin/modulos"]').first()).toBeVisible();
  await expect(
    page.locator('a[href="/admin/campanhas"]').first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Maturidade" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Diagnósticos" })).toHaveCount(0);

  const customerApiResponse = await page.request.post("/api/omdx/diagnostics", {
    data: {},
  });

  expect(customerApiResponse.status()).toBe(403);

  for (const customerPath of ["/docs", "/gantt", "/insights", "/perfil"]) {
    await page.goto(customerPath);
    await expect(page).toHaveURL(/\/admin\/modulos$/);
  }

  await page.evaluate(() => window.localStorage.setItem("theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.evaluate(() => window.localStorage.setItem("theme", "light"));
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
