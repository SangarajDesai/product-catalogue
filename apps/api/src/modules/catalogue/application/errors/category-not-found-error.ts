import { ApplicationError } from "../../../../shared/application/errors/application-error.js";

export class CategoryNotFoundError extends ApplicationError {
  static readonly code = "CATEGORY_NOT_FOUND";

  constructor() {
    super(CategoryNotFoundError.code);
  }
}
