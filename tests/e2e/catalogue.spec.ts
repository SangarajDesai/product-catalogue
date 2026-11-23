import { expect, test } from "@playwright/test";

test("browses the featured catalogue, searches, and opens product details", async ({ page }) => {
  const backpack = "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops";
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Product catalogue" })).toBeVisible();
  const featured = page.getByRole("region", { name: "Featured products" });
  await expect(featured.getByRole("heading", { level: 3 })).toHaveText([
    backpack,
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

  await page.getByRole("navigation", { name: "Categories" }).getByRole("link", { name: "Men's clothing", exact: true }).click();
  const category = page.getByRole("region", { name: "Men's clothing", exact: true });
  const categoryFeatured = category.getByRole("region", { name: "Featured in this category" });
  await expect(categoryFeatured.getByRole("heading", { name: backpack })).toBeVisible();
  await expect(category.getByRole("heading", { name: backpack })).toHaveCount(1);
  await expect(category.getByRole("region", { name: "More in this category" }).getByRole("listitem")).toHaveCount(3);

  const searchBox = page.getByRole("searchbox", { name: "Search products" });
  await expect(page.getByRole("button", { name: "Search" })).toBeDisabled();
  await searchBox.fill("  FoLdSaCk  ");
  await searchBox.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=FoLdSaCk$/);
  const results = page.getByRole("region", { name: "Search results" });
  await expect(results.getByRole("listitem")).toHaveCount(1);
  await results.getByRole("link").filter({ has: page.getByRole("heading", { name: backpack, exact: true }) }).click();

  await expect(page).toHaveURL(/\/products\/1$/);
  const details = page.getByRole("article", { name: backpack });
  await expect(details.getByText("₹109.95")).toBeVisible();
  await expect(details.getByText(/padded sleeve/)).toBeVisible();
  await expect(details.getByRole("img", { name: backpack })).toHaveAttribute("src", "/api/products/1/image");

  await page.goto("/products/1");
  await expect(details.getByRole("heading", { name: backpack })).toBeVisible();
});
