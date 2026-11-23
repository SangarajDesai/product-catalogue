import express, { Router } from "express";
import type { Logger } from "pino";
import { createErrorMiddleware } from "./shared/http/error-middleware.js";
import { HttpError } from "./shared/http/errors/http-error.js";
import type { BusinessErrorResponses } from "./shared/http/errors/to-http-error.js";
import { requestContext } from "./shared/http/request-context.js";

type AppDependencies = {
  logger: Logger;
  routes?: readonly Router[];
  businessErrorResponses?: BusinessErrorResponses;
};

export function createApp({ logger, routes = [], businessErrorResponses }: AppDependencies) {
  const app = express();
  const api = Router();

  app.disable("x-powered-by");
  app.use(requestContext(logger));
  api.use(express.json());
  api.get("/health", (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.json({ status: "ok" });
  });
  for (const router of routes) api.use(router);

  app.use("/api", api);
  app.use((_request, _response, next) => {
    next(new HttpError(404, "NOT_FOUND", "The requested resource was not found."));
  });
  app.use(createErrorMiddleware(businessErrorResponses));

  return app;
}
