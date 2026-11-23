import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import type { RequestHandler } from "express";
import type { Logger } from "pino";

export type RequestLocals = {
  requestId: string;
  errorCode?: string;
};

export function requestContext(logger: Logger): RequestHandler<unknown, unknown, unknown, unknown, RequestLocals> {
  return (request, response, next) => {
    const { locals } = response;
    const startedAt = performance.now();
    const requestId = randomUUID();
    locals.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);

    response.once("finish", () => {
      const routePath: unknown = request.route?.path;
      const status = response.statusCode;
      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

      logger[level]({
        requestId,
        method: request.method,
        route: typeof routePath === "string" ? `/api${routePath}` : "unmatched",
        status,
        durationMs: Math.round(performance.now() - startedAt),
        errorCode: locals.errorCode,
      }, "Request completed");
    });

    next();
  };
}
