import pino from "pino";

export function createLogger(level = "info") {
  return pino({ name: "catalogue-api", level });
}
