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

  await expect(page).toHaveURL(/\/admin\/operacao$/);
  await expect(page.locator('a[href="/admin/operacao"]').first()).toBeVisible();
  await expect(
    page.locator('a[href="/admin/campanhas"]').first(),
  ).toBeVisible();
  await expect(page.locator('a[href="/omdx"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Coletas" })).toHaveCount(0);

  const customerApiResponse = await page.request.post("/api/omdx/diagnostics", {
    data: {},
  });

  expect(customerApiResponse.status()).toBe(403);

  for (const customerPath of ["/docs", "/gantt", "/insights", "/perfil"]) {
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

test("client sidebar exposes collections, maturity and management assets", async ({
  page,
}) => {
  test.setTimeout(60_000);

  const loginResponse = await page.request.post("/api/auth/login", {
    data: {
      email: "cliente@directscal.com.br",
      password: "omdx12345",
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

  await expect(page.getByRole("link", { name: "Coletas" })).toHaveAttribute(
    "href",
    "/omdx/diagnosticos",
  );
  await expect(page.getByText("Maturidade", { exact: true })).toBeVisible();
  await expect(page.getByText("Ativos de gestão", { exact: true })).toBeVisible();

  const assetLinks = [
    ["SOPs", "/ativos-de-gestao/sops"],
    ["Playbooks", "/ativos-de-gestao/playbooks"],
    ["Governança", "/ativos-de-gestao/governanca"],
    ["Matriz RACI", "/ativos-de-gestao/matriz-raci"],
  ] as const;

  for (const [name, href] of assetLinks) {
    await expect(page.getByRole("link", { name })).toHaveAttribute("href", href);
  }

  await page.goto("/ativos-de-gestao/sops");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "SOPs" })).toBeVisible();
  await expect(page.getByText("Atendimento", { exact: true })).toBeVisible();
  await page.getByLabel("Buscar ativos").pressSequentially("financeiro");
  await expect(
    page.getByText("Fechamento financeiro mensal", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Onboarding de novos clientes", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Buscar ativos").fill("");
  await page.getByRole("combobox", { name: "Filtrar por categoria" }).click();
  await page.getByRole("option", { name: "Marketing" }).click();
  await expect(
    page.getByText("Aprovação de campanhas", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir SOP Aprovação de campanhas" }),
  ).toHaveAttribute(
    "href",
    "/ativos-de-gestao/sops/sop-aprovacao-campanhas",
  );
  await expect(
    page.getByText("Fechamento financeiro mensal", { exact: true }),
  ).toHaveCount(0);

  await page.goto("/ativos-de-gestao/sops/sop-onboarding-clientes");
  await expect(
    page.getByRole("heading", { name: "Onboarding de novos clientes" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Objetivo" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Procedimento" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Critério de pronto" }),
  ).toBeVisible();
  await expect(page.getByText("Mariana Costa", { exact: true })).toBeVisible();
  await expect(page.getByText("Customer Success", { exact: true })).toBeVisible();
  await expect(page.getByText("1.3", { exact: true })).toBeVisible();

  for (const [path, heading] of [
    ["/ativos-de-gestao/playbooks", "Playbooks"],
    ["/ativos-de-gestao/governanca", "Governança"],
    ["/ativos-de-gestao/matriz-raci", "Matriz RACI"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }

  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.evaluate(() => window.localStorage.setItem("theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
