import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
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
    <section className="catalogue-page" aria-labelledby="category-heading">
      <div className="category-heading">
        <h2 id="category-heading">{query.data?.category.name ?? "Category"}</h2>
        <Link className="category-close" to="/" aria-label="Close category and return to catalogue" title="Return to catalogue">
          <span aria-hidden="true">×</span>
        </Link>
      </div>
      <CatalogueQueryState query={query} loadingMessage="Loading category…" errorMessage="Could not load the category.">
        {({ featured, products }) => (
          <>
            <section className="category-products" aria-labelledby="category-featured-heading">
              <h3 id="category-featured-heading">Featured in this category</h3>
              <ProductGrid products={[featured]} />
            </section>
            <section className="category-products" aria-labelledby="category-remaining-heading">
              <h3 id="category-remaining-heading">More in this category</h3>
              {products.length > 0 ? <ProductGrid products={products} /> : <p>No additional products in this category.</p>}
            </section>
          </>
        )}
      </CatalogueQueryState>
    </section>
  );
}
