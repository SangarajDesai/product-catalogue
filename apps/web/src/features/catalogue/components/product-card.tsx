import { Link } from "react-router";
import type { ProductSummary } from "../api/schemas/product-summary.schema";
import { ProductPrice } from "./product-price";

export function ProductCard({ id, title, category, price, imageUrl }: ProductSummary) {
  return (
    <article className="product-card">
      <Link className="product-card-link" to={`/products/${id}`}>
        <div className="product-image">
          <img src={imageUrl} alt="" loading="lazy" decoding="async" />
        </div>
        <div className="product-details">
          <p className="product-category">{category.name}</p>
          <h3>{title}</h3>
          <ProductPrice price={price} />
        </div>
      </Link>
    </article>
  );
}
