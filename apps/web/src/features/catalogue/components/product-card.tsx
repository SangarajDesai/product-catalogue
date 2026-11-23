import type { ProductSummary } from "../api/schemas/product-summary.schema";

export function ProductCard({ title, category, price, imageUrl }: ProductSummary) {
  const formattedPrice = new Intl.NumberFormat("en-IN", { style: "currency", currency: price.currency }).format(price.amount);

  return (
    <article className="product-card">
      <div className="product-image">
        <img src={imageUrl} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="product-details">
        <p className="product-category">{category.name}</p>
        <h3>{title}</h3>
        <p className="product-price">{formattedPrice}</p>
      </div>
    </article>
  );
}
