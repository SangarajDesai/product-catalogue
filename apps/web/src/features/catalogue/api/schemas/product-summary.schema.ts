import { z } from "zod";
import { categorySchema } from "./category.schema";

export const productSummarySchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1),
  category: categorySchema,
  price: z.object({ amount: z.number().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/) }),
  imageUrl: z.string().regex(/^\/api\/products\/[1-9]\d*\/image$/),
});

export const productSummariesSchema = z.array(productSummarySchema);
export type ProductSummary = z.infer<typeof productSummarySchema>;
