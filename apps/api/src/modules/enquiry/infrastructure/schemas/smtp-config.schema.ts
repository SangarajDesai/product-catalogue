import { z } from "zod";

const address = z.string().trim().pipe(z.email());

export const smtpConfigSchema = z.object({
  host: z.string().trim().min(1),
  port: z.string().trim().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.int().min(1).max(65535)),
  sender: address,
  recipient: address,
});

export type SmtpConfig = z.infer<typeof smtpConfigSchema>;
