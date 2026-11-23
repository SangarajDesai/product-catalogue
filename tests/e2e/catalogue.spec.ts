import { expect, test } from "@playwright/test";

test("loads the catalogue shell and reaches the API through the web origin", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Product catalogue" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("API is ready.");

  const readiness = await page.request.get("/api/health");
  await expect(readiness).toBeOK();
  expect(await readiness.json()).toEqual({ status: "ok" });
  expect(readiness.headers()["x-request-id"]).toBeTruthy();

  await page.goto("/browser-smoke-deep-link");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Return to the catalogue" }).click();
  await expect(page.getByRole("heading", { name: "Product catalogue" })).toBeVisible();
});
