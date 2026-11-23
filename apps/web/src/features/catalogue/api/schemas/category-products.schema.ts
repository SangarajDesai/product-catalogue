import { z } from "zod";
import { categorySchema } from "./category.schema";
import { productSummariesSchema, productSummarySchema } from "./product-summary.schema";

export const categoryProductsSchema = z.object({
  category: categorySchema,
  featured: productSummarySchema,
  products: productSummariesSchema,
});
