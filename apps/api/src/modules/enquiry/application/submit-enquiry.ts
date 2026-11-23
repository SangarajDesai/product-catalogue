import type { EnquiryContact, EnquiryProduct } from "../domain/enquiry.js";
import type { EmailSender } from "./email-sender.js";
import { EnquiryProductNotFoundError } from "./errors/enquiry-product-not-found-error.js";

type Dependencies = {
  findProduct: (id: number) => Promise<EnquiryProduct | undefined>;
  emailSender: EmailSender;
};

export function createSubmitEnquiry({ findProduct, emailSender }: Dependencies) {
  return async (productId: number, contact: EnquiryContact): Promise<void> => {
    const product = await findProduct(productId);
    if (!product) throw new EnquiryProductNotFoundError();

    await emailSender.send({ ...contact, product });
  };
}
