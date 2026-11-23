import { z } from "zod";

export const enquiryRequestSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().pipe(z.email()),
  message: z.string().trim().transform((message) => message || undefined).optional(),
});
