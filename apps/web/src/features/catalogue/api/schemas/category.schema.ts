import { z } from "zod";

export const categorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
});

export const categoriesSchema = z.array(categorySchema);
