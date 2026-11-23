import type { ProductSummary } from "../api/schemas/product-summary.schema";

export function ProductPrice({ price }: Pick<ProductSummary, "price">) {
  const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: price.currency }).format(price.amount);
  return <p className="product-price">{formatted}</p>;
}
