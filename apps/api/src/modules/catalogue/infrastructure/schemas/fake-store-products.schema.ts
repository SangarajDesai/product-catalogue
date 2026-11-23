import { z } from "zod";

const fakeStoreProduct = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: z.string().trim().min(1),
  price: z.number().nonnegative(),
  image: z.string().trim().url(),
});

export const fakeStoreProductsSchema = z.array(fakeStoreProduct).min(1);
