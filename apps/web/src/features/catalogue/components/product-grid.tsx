import type { ProductSummary } from "../api/schemas/product-summary.schema";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: readonly ProductSummary[] }) {
  return (
    <ul className="product-grid" role="list">
      {products.map((product) => (
        <li key={product.id}><ProductCard {...product} /></li>
      ))}
    </ul>
  );
}
