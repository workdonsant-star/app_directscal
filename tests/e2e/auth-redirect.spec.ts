import { expect, test } from "@playwright/test";

test("authenticated app redirects anonymous users to login", async ({ page }) => {
  await page.goto("/omdx");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
});
