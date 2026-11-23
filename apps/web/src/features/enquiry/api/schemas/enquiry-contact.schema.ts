import { z } from "zod";

export const enquiryContactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.string().trim().pipe(z.email("Enter a valid email address.")),
  message: z.string().trim().transform((message) => message || undefined),
});

export type EnquiryContact = z.output<typeof enquiryContactSchema>;
