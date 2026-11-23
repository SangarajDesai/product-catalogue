import nodemailer from "nodemailer";
import type { EmailSender } from "../application/email-sender.js";
import { MailUnavailableError } from "../application/errors/mail-unavailable-error.js";
import type { SmtpConfig } from "./schemas/smtp-config.schema.js";

export function createSmtpEmailSender(config: SmtpConfig): EmailSender {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  return {
    async send({ product, name, email, message }) {
      const contact = `From ${name} <${email}>`;
      const text = [`Product #${product.id}`, product.title, "", contact];
      if (message) text.push("", message);

      try {
        const delivery = await transport.sendMail({
          from: config.sender,
          to: config.recipient,
          replyTo: email,
          subject: `Product enquiry #${product.id}`,
          text: text.join("\n"),
        });
        if (delivery.accepted.length !== 1) throw new Error("SMTP did not accept the sales recipient.");
      } catch (cause) {
        throw new MailUnavailableError({ cause });
      }
    },
  };
}
