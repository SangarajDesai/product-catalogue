import { Writable } from "node:stream";
import { Router } from "express";
import pino from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { ApplicationError } from "../src/shared/application/errors/application-error.js";

function setup(dependencies: Omit<Parameters<typeof createApp>[0], "logger"> = {}) {
  const entries: string[] = [];
  const logger = pino(new Writable({
    write(chunk, _encoding, done) {
      entries.push(String(chunk));
      done();
    },
  }));

  return { api: request(createApp({ logger, ...dependencies })), entries };
}

describe("Express app", () => {
  it("returns readiness and correlates it with a structured log", async () => {
    const { api, entries } = setup();
    const response = await api.get("/api/health").expect(200, { status: "ok" });
    const requestId = response.get("X-Request-Id");

    expect(requestId).toBeTruthy();
    expect(JSON.parse(entries[0])).toMatchObject({
      requestId,
      method: "GET",
      route: "/api/health",
      status: 200,
      durationMs: expect.any(Number),
    });
  });

  it("returns a correlated JSON error for an unknown API route", async () => {
    const { api, entries } = setup();
    const response = await api.get("/api/missing").expect(404);

    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource was not found.",
        requestId: response.get("X-Request-Id"),
      },
    });
    expect(JSON.parse(entries[0])).toMatchObject({ errorCode: "NOT_FOUND", status: 404 });
  });

  it("maps malformed JSON without including the submitted data in errors or logs", async () => {
    const { api, entries } = setup();
    const privateValue = "shopper@example.test";
    const response = await api.post("/api/example")
      .set("Content-Type", "application/json")
      .send(`{"email":"${privateValue}"`)
      .expect(400);

    expect(response.body.error).toMatchObject({
      code: "INVALID_JSON",
      requestId: response.get("X-Request-Id"),
    });
    expect(response.text).not.toContain(privateValue);
    expect(entries.join("")).not.toContain(privateValue);
  });

  it("uses a module's business error response when an async handler rejects", async () => {
    class MailUnavailableError extends ApplicationError {
      constructor() {
        super("MAIL_UNAVAILABLE", { cause: new Error("Private SMTP diagnostic") });
      }
    }

    const router = Router();
    router.get("/delivery", async () => {
      throw new MailUnavailableError();
    });
    const { api, entries } = setup({
      routes: [router],
      businessErrorResponses: new Map([
        ["MAIL_UNAVAILABLE", { status: 503, message: "Could not send the enquiry. Try again." }],
      ]),
    });
    const response = await api.get("/api/delivery").expect(503);

    expect(response.body.error).toEqual({
      code: "MAIL_UNAVAILABLE",
      message: "Could not send the enquiry. Try again.",
      requestId: response.get("X-Request-Id"),
    });
    expect(JSON.parse(entries[0])).toMatchObject({
      route: "/api/delivery",
      status: 503,
      errorCode: "MAIL_UNAVAILABLE",
    });
    expect(entries.join("")).not.toContain("Private SMTP diagnostic");
  });

  it("uses the generic response for an unregistered business error", async () => {
    const router = Router();
    router.get("/unmapped", async () => {
      throw new ApplicationError("UNREGISTERED_ERROR");
    });
    const { api, entries } = setup({ routes: [router] });
    const response = await api.get("/api/unmapped").expect(500);

    expect(response.body.error.code).toBe("INTERNAL_ERROR");
    expect(response.text).not.toContain("UNREGISTERED_ERROR");
    expect(entries.join("")).not.toContain("UNREGISTERED_ERROR");
  });

  it("keeps unexpected async error details and query values out of the response and logs", async () => {
    const router = Router();
    const providerDetail = "private provider diagnostic";
    const queryValue = "shopper@example.test";
    router.get("/failure", async () => {
      throw new Error(providerDetail);
    });
    const { api, entries } = setup({ routes: [router] });
    const response = await api.get("/api/failure").query({ email: queryValue }).expect(500);

    expect(response.body.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
      requestId: response.get("X-Request-Id"),
    });
    expect(JSON.parse(entries[0])).toMatchObject({
      route: "/api/failure",
      requestId: response.get("X-Request-Id"),
      errorCode: "INTERNAL_ERROR",
    });
    expect(response.text).not.toContain(providerDetail);
    expect(entries.join("")).not.toContain(providerDetail);
    expect(entries.join("")).not.toContain(queryValue);
  });
});
