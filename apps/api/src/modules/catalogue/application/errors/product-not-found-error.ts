import { ApplicationError } from "../../../../shared/application/errors/application-error.js";

export class ProductNotFoundError extends ApplicationError {
  static readonly code = "PRODUCT_NOT_FOUND";

  constructor() {
    super(ProductNotFoundError.code);
  }
}
