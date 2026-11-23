import { postNoContent } from "../../../shared/http/api-client";
import type { EnquiryContact } from "./schemas/enquiry-contact.schema";

export function submitEnquiry(productId: number, contact: EnquiryContact) {
  return postNoContent(`/api/products/${productId}/enquiries`, contact);
}
