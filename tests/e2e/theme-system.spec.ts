import { expect, test } from "@playwright/test";

test("tema Sistema acompanha a preferência do dispositivo", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("theme"));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/demo/admin/especialistas");
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Abrir menu de Admin Directscal" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Sistema" })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  await page.getByRole("button", { name: "Abrir menu de Admin Directscal" }).click();
  await page.getByRole("menuitemradio", { name: "Escuro" }).click({ force: true });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  await page.getByRole("button", { name: "Abrir menu de Admin Directscal" }).click();
  await page.getByRole("menuitemradio", { name: "Sistema" }).click({ force: true });
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
});
