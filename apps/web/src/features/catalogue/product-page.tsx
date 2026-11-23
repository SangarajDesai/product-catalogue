import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { getProduct } from "./api/catalogue-browsing";
import { CatalogueQueryState } from "./components/catalogue-query-state";
import { ProductPrice } from "./components/product-price";

export function ProductPage({ renderEnquiry }: { renderEnquiry?: (productId: number) => ReactNode }) {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["catalogue", "product", id],
    queryFn: ({ signal }) => getProduct(id, signal),
    retry: false,
  });

  return (
    <div className="catalogue-page">
      <CatalogueQueryState query={query} loadingMessage="Loading product…" errorMessage="Could not load the product.">
        {({ id: productId, title, category, price, imageUrl, description }) => (
          <article className="product-page" aria-labelledby="product-heading">
            <div className="product-image">
              <img src={imageUrl} alt={title} />
            </div>
            <div className="product-page-copy">
              <Link className="product-category" to={`/categories/${category.slug}`}>{category.name}</Link>
              <h2 id="product-heading">{title}</h2>
              <ProductPrice price={price} />
              <p className="product-description">{description}</p>
              {renderEnquiry?.(productId)}
            </div>
          </article>
        )}
      </CatalogueQueryState>
    </div>
  );
}
