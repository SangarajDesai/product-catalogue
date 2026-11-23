import { z } from "zod";

const productId = z.number().int().positive();
const productIdFromText = z.string().trim().regex(/^[1-9][0-9]*$/).transform(Number).pipe(productId);
const categorySlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const catalogueConfigSchema = z.object({
  mode: z.enum(["live", "snapshot"]),
  home: z.array(productIdFromText).length(5),
  categories: z.record(categorySlug, productId),
});
