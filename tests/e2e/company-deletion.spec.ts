import { test, expect } from "@playwright/test";

test.skip(process.env.DIRECTSCAL_COMPANY_DELETE_FIXTURE !== "true", "Requer rota temporária de fixture; nunca usa empresas reais.");
const ids = ["company_00000000-0000-4000-8000-000000000001", "company_00000000-0000-4000-8000-000000000002"];
const companies = ids.map((id, index) => ({ id, organizationId: id.slice(8), name: index ? "Lumen Health" : "Vertex Logistics", employeeCount: 10,
  companySize: "1–10 pessoas", moduleAccess: [], sources: [], leadCount: 0, lastLeadAt: null }));

for (const theme of ["light", "dark"]) {
  test(`seleção, confirmação, falha e exclusão — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    let removed = false;
    let attempts = 0;
    await page.route("**/api/admin/acquisition", (route) => route.fulfill({ json: { companies: removed ? [] : companies, modules: [], campaigns: [], leads: [] } }));
    await page.route("**/api/admin/companies", async (route) => {
      expect(route.request().method()).toBe("DELETE");
      expect(route.request().postDataJSON()).toEqual({ companyIds: ids, confirmation: "EXCLUIR" });
      attempts++;
      if (attempts === 1) return route.fulfill({ status: 409, json: { message: "Operação em andamento. Nenhuma empresa foi excluída." } });
      removed = true;
      await route.fulfill({ json: { deletedCompanyIds: ids, deletedUsers: 1, retainedUsers: 1 } });
    });
    await page.goto("/company-deletion-fixture");
    await expect(page.getByRole("checkbox", { name: "Selecionar Vertex Logistics", exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "Selecionar Vertex Logistics", exact: true }).check();
    await expect(page.getByRole("checkbox", { name: "Selecionar todas as empresas" })).toHaveJSProperty("indeterminate", true);
    await page.getByRole("button", { name: "Excluir selecionadas (1)" }).click();
    await expect(page.getByRole("dialog")).toContainText("Vertex Logistics");
    await expect(page.getByRole("dialog")).not.toContainText("Lumen Health");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect(attempts).toBe(0);
    await page.getByRole("checkbox", { name: "Selecionar todas as empresas" }).check();
    await page.screenshot({ path: `/tmp/company-deletion-${theme}-table.png`, fullPage: true });
    await page.getByRole("button", { name: "Excluir selecionadas (2)" }).click();
    const confirm = page.getByRole("button", { name: "Excluir definitivamente", exact: true });
    await expect(confirm).toBeDisabled();
    await page.getByLabel("Digite EXCLUIR para confirmar").fill("EXCLUIR");
    await expect(confirm).toBeEnabled();
    await page.screenshot({ path: `/tmp/company-deletion-${theme}-dialog.png`, fullPage: true });
    await confirm.click();
    await expect(page.getByRole("alert")).toContainText("Nenhuma empresa foi excluída");
    await expect(page.getByLabel("Digite EXCLUIR para confirmar")).toHaveValue("EXCLUIR");
    await expect(page.getByRole("dialog")).toContainText("Lumen Health");
    await confirm.click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("status")).toContainText("1 conta preservada");
    await expect(page.getByText("Nenhuma empresa mapeada até agora.")).toBeVisible();
    expect(attempts).toBe(2);
  });
}
