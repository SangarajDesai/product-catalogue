import { smtpConfigSchema } from "./schemas/smtp-config.schema.js";

export function readSmtpConfig(env: Readonly<Record<string, string | undefined>>) {
  return smtpConfigSchema.safeParse({
    host: env.SMTP_HOST ?? "localhost",
    port: env.SMTP_PORT ?? "1025",
    sender: env.SMTP_FROM ?? "catalogue@example.test",
    recipient: env.SMTP_TO ?? "sales@example.test",
  });
}
