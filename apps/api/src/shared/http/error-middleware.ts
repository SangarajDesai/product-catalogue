import type { ErrorRequestHandler } from "express";
import { toHttpError, type BusinessErrorResponses } from "./errors/to-http-error.js";
import type { RequestLocals } from "./request-context.js";

export function createErrorMiddleware(
  businessErrorResponses?: BusinessErrorResponses,
): ErrorRequestHandler<unknown, unknown, unknown, unknown, RequestLocals> {
  const responses = new Map(businessErrorResponses);

  return (error: unknown, _request, response, next) => {
    const { locals } = response;
    const failure = toHttpError(error, responses);
    locals.errorCode = failure.code;

    if (response.headersSent) {
      next(failure);
      return;
    }

    response.status(failure.status).json({
      error: { code: failure.code, message: failure.message, requestId: locals.requestId },
    });
  };
}
