import { readFile } from "node:fs/promises";
import type { ProductImage, ProductImageProvider } from "../application/product-image-provider.js";
import { fakeStoreOrigin } from "./product-sources.js";
import { readCatalogueResponseBody } from "./read-catalogue-response-body.js";

const placeholderFile = new URL("../../../../assets/catalogue/placeholder.png", import.meta.url);
const accept = "image/jpeg, image/png, image/webp";
const signatures: ReadonlyMap<string, (bytes: Buffer) => boolean> = new Map([
  ["image/jpeg", (bytes) => bytes.subarray(0, 3).toString("hex") === "ffd8ff"],
  ["image/png", (bytes) => bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"],
  ["image/webp", (bytes) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"],
]);

function allowedImageUrl(source: string): URL | undefined {
  if (!URL.canParse(source)) return undefined;
  const url = new URL(source);
  if (url.origin !== fakeStoreOrigin || url.username || url.password || url.search || url.hash) return undefined;
  return /^\/img\/[a-z0-9._+-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname) ? url : undefined;
}

export async function createProductImageProvider(fetchImage: typeof fetch = fetch): Promise<ProductImageProvider> {
  const placeholder: ProductImage = { contentType: "image/png", bytes: await readFile(placeholderFile) };

  return {
    async get(source) {
      const url = allowedImageUrl(source);
      if (!url) return placeholder;

      try {
        const response = await fetchImage(url, {
          headers: { Accept: accept },
          redirect: "error",
          signal: AbortSignal.timeout(3000),
        });
        const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
        const matchesSignature = signatures.get(contentType);
        if (!response.ok || !matchesSignature) {
          void response.body?.cancel().catch(() => undefined);
          return placeholder;
        }

        const bytes = await readCatalogueResponseBody(response, 2 * 1024 * 1024);
        return matchesSignature(bytes) ? { contentType, bytes } : placeholder;
      } catch {
        return placeholder;
      }
    },
  };
}
