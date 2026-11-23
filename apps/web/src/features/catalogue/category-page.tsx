import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { getCategoryProducts } from "./api/catalogue-browsing";
import { CatalogueQueryState } from "./components/catalogue-query-state";
import { ProductGrid } from "./components/product-grid";

export function CategoryPage() {
  const { slug = "" } = useParams();
  const query = useQuery({
    queryKey: ["catalogue", "category", slug],
    queryFn: ({ signal }) => getCategoryProducts(slug, signal),
    retry: false,
  });

  return (
    <div className="catalogue-page">
      <CatalogueQueryState query={query} loadingMessage="Loading category…" errorMessage="Could not load the category.">
        {({ category, featured, products }) => (
          <section aria-labelledby="category-heading">
            <h2 id="category-heading">{category.name}</h2>
            <section className="category-products" aria-labelledby="category-featured-heading">
              <h3 id="category-featured-heading">Featured in this category</h3>
              <ProductGrid products={[featured]} />
            </section>
            <section className="category-products" aria-labelledby="category-remaining-heading">
              <h3 id="category-remaining-heading">More in this category</h3>
              {products.length > 0 ? <ProductGrid products={products} /> : <p>No additional products in this category.</p>}
            </section>
          </section>
        )}
      </CatalogueQueryState>
    </div>
  );
}
