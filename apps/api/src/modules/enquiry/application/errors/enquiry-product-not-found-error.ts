import { ApplicationError } from "../../../../shared/application/errors/application-error.js";

export class EnquiryProductNotFoundError extends ApplicationError {
  static readonly code = "ENQUIRY_PRODUCT_NOT_FOUND";

  constructor() {
    super(EnquiryProductNotFoundError.code);
  }
}
