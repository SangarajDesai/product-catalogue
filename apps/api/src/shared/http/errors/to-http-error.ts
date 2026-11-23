import { ApplicationError } from "../../application/errors/application-error.js";
import { HttpError } from "./http-error.js";

export type BusinessErrorResponses = ReadonlyMap<string, { readonly status: number; readonly message: string }>;

const commonResponses: BusinessErrorResponses = new Map([
  ["INVALID_INPUT", { status: 400, message: "The request is invalid." }],
  ["NOT_FOUND", { status: 404, message: "The requested resource was not found." }],
]);

export function toHttpError(error: unknown, businessErrorResponses: BusinessErrorResponses): HttpError {
  if (error instanceof HttpError) return error;

  if (error instanceof ApplicationError) {
    const response = commonResponses.get(error.code) ?? businessErrorResponses.get(error.code);
    if (response) return new HttpError(response.status, error.code, response.message);
  }

  // Express's JSON parser can attach the raw request body to these errors.
  if (error instanceof Error && "type" in error && error.type === "entity.parse.failed") {
    return new HttpError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }
  if (error instanceof Error && "type" in error && error.type === "entity.too.large") {
    return new HttpError(413, "REQUEST_TOO_LARGE", "The request body is too large.");
  }

  return new HttpError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}
