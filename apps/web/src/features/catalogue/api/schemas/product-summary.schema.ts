import { z } from "zod";

export const productSummarySchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1),
  category: z.object({ slug: z.string().min(1), name: z.string().min(1) }),
  price: z.object({ amount: z.number().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/) }),
  imageUrl: z.string().regex(/^\/api\/products\/[1-9]\d*\/image$/),
});

export type ProductSummary = z.infer<typeof productSummarySchema>;
