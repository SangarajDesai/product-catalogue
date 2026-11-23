import { z } from "zod";

export const productIdSchema = z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.int().positive());
export const categorySlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const searchTermSchema = z.string().trim().min(1);
