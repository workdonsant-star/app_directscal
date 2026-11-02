import { expect, test } from "@playwright/test";

test("pasta e arquivos enviados pelo superadmin aparecem para o cliente na demo", async ({ page }) => {
  await page.goto("/demo/admin/empresas/demo-vertex");
  await expect(page.getByRole("link", { name: "Operação", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Rotinas", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Arquivos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Arquivos", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Novo ativo" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Editor de ativos" })).toHaveCount(0);
  await page.getByRole("button", { name: /Gestão de pessoas/ }).click();
  await expect(page.getByRole("link", { name: "Plano de Desenvolvimento de Prestador" })).toBeVisible();
  await page.getByRole("button", { name: "Todas as pastas" }).click();

  await page.getByRole("button", { name: "Nova pasta" }).click();
  await page.getByRole("textbox", { name: "Nome da nova pasta" }).fill("Pasta piloto");
  await page.getByRole("button", { name: "Criar pasta" }).click();
  await expect(page.getByText("Pasta criada. Ela já aparece na visão do cliente.")).toBeVisible();
  await page.getByRole("button", { name: "Novo arquivo" }).click();
  await page.getByRole("combobox", { name: "Pasta" }).click();
  await page.getByRole("option", { name: "Pasta piloto" }).click();
  await page.getByRole("textbox", { name: "Título" }).fill("Manual piloto");
  await page.getByLabel("Arquivo", { exact: true }).setInputFiles({ name: "manual.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nativo fictício") });
  await page.getByRole("button", { name: "Enviar e publicar" }).click();
  await expect(page.getByText("Arquivo enviado e disponível para o cliente.")).toBeVisible();
  await page.getByRole("button", { name: /Pasta piloto/ }).click();
  await expect(page.getByRole("button", { name: "Manual piloto", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Demo" }).click();
  await page.getByRole("menuitem", { name: "Visão do cliente" }).click();
  await page.getByRole("link", { name: "Pasta piloto" }).click();
  await expect(page.getByRole("button", { name: "Manual piloto" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Manual piloto" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("manual.pdf");

  await page.goto("/demo/admin/empresas/demo-vertex/criacao-dos-ativos");
  await page.getByRole("button", { name: "Novo arquivo" }).click();
  await page.getByRole("combobox", { name: "Destino" }).click();
  await page.getByRole("option", { name: "Relatório de diagnóstico" }).click();
  await page.getByRole("textbox", { name: "Título" }).fill("Diagnóstico piloto");
  await page.getByLabel("Arquivo", { exact: true }).setInputFiles({ name: "diagnostico.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nrelatório fictício") });
  await page.getByRole("button", { name: "Enviar e publicar" }).click();
  await expect(page.getByText("Arquivo enviado e disponível para o cliente.")).toBeVisible();
  await page.goto("/demo/relatorios");
  await expect(page.getByRole("button", { name: "Diagnóstico piloto" })).toBeVisible();
});

test("Novo arquivo abre a modal no tema escuro", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/demo/admin/empresas/demo-vertex/criacao-dos-ativos");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Novo arquivo" }).click();
  await expect(page.getByRole("dialog", { name: "Novo arquivo" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Destino" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Título" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("dialog", { name: "Novo arquivo" })).toHaveCount(0);
});
