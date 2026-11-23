import { ApplicationError } from "../../../../shared/application/errors/application-error.js";

export type CatalogueLoadFailure =
  | "INVALID_CATALOGUE_CONFIGURATION"
  | "UPSTREAM_UNAVAILABLE"
  | "INVALID_CATALOGUE_DATA"
  | "FEATURED_SELECTION_MISMATCH"
  | "SNAPSHOT_UNAVAILABLE";

export class CatalogueLoadError extends ApplicationError {
  constructor(readonly reason: CatalogueLoadFailure, options?: ErrorOptions) {
    super(reason, options);
  }
}
