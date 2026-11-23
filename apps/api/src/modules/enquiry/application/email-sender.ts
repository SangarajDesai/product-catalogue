import type { ProductEnquiry } from "../domain/enquiry.js";

export interface EmailSender {
  send(enquiry: ProductEnquiry): Promise<void>;
}
