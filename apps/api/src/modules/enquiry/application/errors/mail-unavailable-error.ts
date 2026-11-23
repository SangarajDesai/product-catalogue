import { ApplicationError } from "../../../../shared/application/errors/application-error.js";

export class MailUnavailableError extends ApplicationError {
  static readonly code = "MAIL_UNAVAILABLE";

  constructor(options?: ErrorOptions) {
    super(MailUnavailableError.code, options);
  }
}
