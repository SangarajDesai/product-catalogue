export type EnquiryProduct = Readonly<{ id: number; title: string }>;

export type EnquiryContact = Readonly<{
  name: string;
  email: string;
  message?: string;
}>;

export type ProductEnquiry = EnquiryContact & Readonly<{ product: EnquiryProduct }>;
