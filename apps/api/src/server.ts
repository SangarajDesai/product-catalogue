import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createLogger } from "./shared/logging/logger.js";

const envFile = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const host = process.env.API_HOST ?? "127.0.0.1";
const port = Number(process.env.API_PORT ?? "3000");
const logger = createLogger(process.env.LOG_LEVEL);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("API_PORT must be an integer between 1 and 65535.");
}

const app = createApp({ logger });
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
