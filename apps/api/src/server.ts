import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createCatalogue } from "./modules/catalogue/application/catalogue.js";
import { CatalogueLoadError } from "./modules/catalogue/application/errors/catalogue-load-error.js";
import { loadCatalogue } from "./modules/catalogue/application/load-catalogue.js";
import { catalogueErrorResponses, createCatalogueRoutes } from "./modules/catalogue/http/catalogue-routes.js";
import { readCatalogueConfig } from "./modules/catalogue/infrastructure/catalogue-config.js";
import { createProductImageProvider } from "./modules/catalogue/infrastructure/product-images.js";
import { createFakeStoreRepository, createSnapshotRepository } from "./modules/catalogue/infrastructure/product-sources.js";
import { createSubmitEnquiry } from "./modules/enquiry/application/submit-enquiry.js";
import { createEnquiryRoutes, enquiryErrorResponses } from "./modules/enquiry/http/enquiry-routes.js";
import { readSmtpConfig } from "./modules/enquiry/infrastructure/smtp-config.js";
import { createSmtpEmailSender } from "./modules/enquiry/infrastructure/smtp-email-sender.js";
import { createLogger } from "./shared/logging/logger.js";

const envFile = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const host = process.env.API_HOST ?? "127.0.0.1";
const port = Number(process.env.API_PORT ?? "3000");
const logger = createLogger(process.env.LOG_LEVEL);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("API_PORT must be an integer between 1 and 65535.");
}

async function initializeCatalogue() {
  const config = readCatalogueConfig(process.env);
  const result = await loadCatalogue({
    ...config,
    live: createFakeStoreRepository(),
    snapshot: createSnapshotRepository(),
  });
  const imageProvider = await createProductImageProvider();
  const catalogue = createCatalogue({ list: async () => result.products }, imageProvider, config.featured);

  if (result.fallbackReason) {
    logger.warn({ source: result.source, reason: result.fallbackReason }, "Using bundled catalogue after live load failed");
  } else {
    logger.info({ source: result.source }, "Catalogue loaded");
  }
  return catalogue;
}

async function startServer() {
  const smtpConfig = readSmtpConfig(process.env);
  if (!smtpConfig.success) {
    logger.error({ code: "INVALID_SMTP_CONFIG" }, "Check the SMTP host, port, sender, and sales recipient.");
    process.exitCode = 1;
    return;
  }

  let catalogue: Awaited<ReturnType<typeof initializeCatalogue>>;
  try {
    catalogue = await initializeCatalogue();
  } catch (error) {
    const reason = error instanceof CatalogueLoadError ? error.reason : "CATALOGUE_ASSETS_UNAVAILABLE";
    logger.error({ code: "CATALOGUE_STARTUP_FAILED", reason }, "Could not initialize catalogue. Check featured selections and bundled assets.");
    process.exitCode = 1;
    return;
  }

  const submitEnquiry = createSubmitEnquiry({
    findProduct: catalogue.findProductReference,
    emailSender: createSmtpEmailSender(smtpConfig.data),
  });
  const app = createApp({
    logger,
    routes: [createCatalogueRoutes(catalogue), createEnquiryRoutes(submitEnquiry)],
    businessErrorResponses: new Map([...catalogueErrorResponses, ...enquiryErrorResponses]),
  });
  const server = app.listen(port, host, (error) => {
    if (error) {
      const systemCode = (error as NodeJS.ErrnoException).code;
      logger.error({ code: "LISTEN_FAILED", systemCode, port }, "API failed to start");
      process.exitCode = 1;
      return;
    }
    logger.info({ port }, "API is ready");
  });

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => server.close());
  }
}

await startServer();
