import { z } from "zod";

export const categorySlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const searchTermSchema = z.string().trim().min(1);
