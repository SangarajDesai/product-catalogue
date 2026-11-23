export type ProductImage = Readonly<{
  contentType: string;
  bytes: Uint8Array;
}>;

export interface ProductImageProvider {
  get(source: string): Promise<ProductImage>;
}
