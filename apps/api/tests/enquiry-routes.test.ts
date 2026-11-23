import { Writable } from "node:stream";
import pino from "pino";
import request from "supertest";
import { expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type { EmailSender } from "../src/modules/enquiry/application/email-sender.js";
import { MailUnavailableError } from "../src/modules/enquiry/application/errors/mail-unavailable-error.js";
import { createSubmitEnquiry } from "../src/modules/enquiry/application/submit-enquiry.js";
import { createEnquiryRoutes, enquiryErrorResponses } from "../src/modules/enquiry/http/enquiry-routes.js";

const product = { id: 1, title: "Trail backpack" };
const contact = { name: "Example Shopper", email: "shopper@example.test", message: "Ask about the padded sleeve." };

function setup() {
  const logs: string[] = [];
  const logger = pino(new Writable({
    write(chunk, _encoding, done) {
      logs.push(String(chunk));
      done();
    },
  }));
  const findProduct = vi.fn(async (id: number) => id === product.id ? product : undefined);
  const send = vi.fn<EmailSender["send"]>().mockResolvedValue(undefined);
  const submitEnquiry = createSubmitEnquiry({ findProduct, emailSender: { send } });
  const api = request(createApp({
    logger,
    routes: [createEnquiryRoutes(submitEnquiry)],
    businessErrorResponses: enquiryErrorResponses,
  }));
  return { api, findProduct, send, logs };
}

it("uses the server-side product, trims the contact fields, and returns 204 without logging contact data", async () => {
  const { api, findProduct, send, logs } = setup();
  const response = await api.post("/api/products/1/enquiries").send({
    name: `  ${contact.name}  `,
    email: ` ${contact.email} `,
    message: ` ${contact.message} `,
    product: { id: 999, title: "Client-supplied title" },
  }).expect(204);

  expect(response.text).toBe("");
  expect(findProduct).toHaveBeenCalledWith(1);
  expect(send).toHaveBeenCalledExactlyOnceWith({ product, ...contact });
  expect(JSON.parse(logs[0])).toMatchObject({ status: 204, requestId: response.get("X-Request-Id") });
  for (const value of Object.values(contact)) expect(logs.join("")).not.toContain(value);
});

it.each([undefined, "   "])("omits an absent or whitespace-only message", async (message) => {
  const { api, send } = setup();
  await api.post("/api/products/1/enquiries").send({ ...contact, message }).expect(204);
  expect(send).toHaveBeenCalledExactlyOnceWith({ product, name: contact.name, email: contact.email, message: undefined });
});

it.each([
  ["a blank name", { ...contact, name: "  " }],
  ["an invalid email", { ...contact, email: "invalid-address" }],
  ["a non-string message", { ...contact, message: 12 }],
])("rejects %s before resolving or sending", async (_case, body) => {
  const { api, findProduct, send } = setup();
  await api.post("/api/products/1/enquiries").send(body).expect(400);
  expect(findProduct).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});

it("rejects an invalid ID and an unknown product without sending mail", async () => {
  const { api, findProduct, send } = setup();
  await api.post("/api/products/1e3/enquiries").send(contact).expect(400);
  expect(findProduct).not.toHaveBeenCalled();
  const response = await api.post("/api/products/99/enquiries").send(contact).expect(404);
  expect(response.body.error).toMatchObject({ code: "ENQUIRY_PRODUCT_NOT_FOUND", requestId: response.get("X-Request-Id") });
  expect(send).not.toHaveBeenCalled();
});

it("returns a request-linked 503 without logging contact data or SMTP diagnostics", async () => {
  const { api, send, logs } = setup();
  const smtpDiagnostic = `SMTP rejection for ${contact.email}`;
  send.mockRejectedValueOnce(new MailUnavailableError({ cause: new Error(smtpDiagnostic) }));

  const response = await api.post("/api/products/1/enquiries").send(contact).expect(503);
  const requestId = response.get("X-Request-Id");
  expect(response.body.error).toEqual({ code: "MAIL_UNAVAILABLE", message: "Could not send the enquiry. Try again.", requestId });
  expect(JSON.parse(logs[0])).toMatchObject({ route: "/api/products/:id/enquiries", status: 503, errorCode: "MAIL_UNAVAILABLE", requestId });
  for (const value of [...Object.values(contact), smtpDiagnostic]) {
    expect(logs.join("")).not.toContain(value);
    expect(response.text).not.toContain(value);
  }
});
