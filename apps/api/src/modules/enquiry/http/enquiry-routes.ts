import { Router } from "express";
import { HttpError } from "../../../shared/http/errors/http-error.js";
import type { BusinessErrorResponses } from "../../../shared/http/errors/to-http-error.js";
import { positiveIntegerParamSchema } from "../../../shared/http/schemas/positive-integer-param.schema.js";
import { EnquiryProductNotFoundError } from "../application/errors/enquiry-product-not-found-error.js";
import { MailUnavailableError } from "../application/errors/mail-unavailable-error.js";
import type { createSubmitEnquiry } from "../application/submit-enquiry.js";
import { enquiryRequestSchema } from "./schemas/enquiry-request.schema.js";

export const enquiryErrorResponses: BusinessErrorResponses = new Map([
  [EnquiryProductNotFoundError.code, { status: 404, message: "The product was not found." }],
  [MailUnavailableError.code, { status: 503, message: "Could not send the enquiry. Try again." }],
]);

export function createEnquiryRoutes(submitEnquiry: ReturnType<typeof createSubmitEnquiry>) {
  const router = Router();

  router.post("/products/:id/enquiries", async (request, response) => {
    const id = positiveIntegerParamSchema.safeParse(request.params.id);
    if (!id.success) throw new HttpError(400, "INVALID_INPUT", "The product ID must be a positive integer.");

    const contact = enquiryRequestSchema.safeParse(request.body);
    if (!contact.success) throw new HttpError(400, "INVALID_INPUT", "Enter your name and a valid email address.");

    await submitEnquiry(id.data, contact.data);
    response.status(204).end();
  });

  return router;
}
