import { expect, test } from "@playwright/test";

test("shows the five featured products in order through the web origin", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Product catalogue" })).toBeVisible();
  const featured = page.getByRole("region", { name: "Featured products" });
  await expect(featured.getByRole("heading", { level: 3 })).toHaveText([
    "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
    "Mens Casual Premium Slim Fit T-Shirts",
    "John Hardy Women's Legends Naga Gold & Silver Dragon Station Chain Bracelet",
    "WD 2TB Elements Portable External Hard Drive - USB 3.0",
    "BIYLACLESEN Women's 3-in-1 Snowboard Jacket Winter Coats",
  ]);
  await expect(featured.getByText("₹109.95")).toBeVisible();
  const images = featured.locator("img");
  await expect(images).toHaveCount(5);
  await expect(images.first()).toHaveAttribute("src", "/api/products/1/image");

  const image = await page.request.get("/api/products/1/image");
  await expect(image).toBeOK();
  expect(image.headers()["content-type"]).toMatch(/^image\/(jpeg|png|webp)\b/);

  const readiness = await page.request.get("/api/health");
  await expect(readiness).toBeOK();
  expect(await readiness.json()).toEqual({ status: "ok" });
  expect(readiness.headers()["x-request-id"]).toBeTruthy();

  await page.goto("/browser-smoke-deep-link");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Return to the catalogue" }).click();
  await expect(featured.getByRole("listitem")).toHaveCount(5);
});
