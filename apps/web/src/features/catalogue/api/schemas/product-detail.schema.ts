import { z } from "zod";
import { productSummarySchema } from "./product-summary.schema";

export const productDetailSchema = productSummarySchema.extend({ description: z.string().trim().min(1) });
