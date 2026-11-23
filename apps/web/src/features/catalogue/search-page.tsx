import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { searchProducts } from "./api/catalogue-browsing";
import { CatalogueQueryState } from "./components/catalogue-query-state";
import { ProductGrid } from "./components/product-grid";

export function SearchPage() {
  const [params] = useSearchParams();
  const term = (params.get("q") ?? "").trim();
  const query = useQuery({
    queryKey: ["catalogue", "search", term],
    queryFn: ({ signal }) => searchProducts(term, signal),
    enabled: term.length > 0,
    retry: false,
  });

  return (
    <section className="catalogue-page" aria-labelledby="search-results-heading">
      <h2 id="search-results-heading">Search results</h2>
      {term ? (
        <CatalogueQueryState query={query} loadingMessage="Searching products…" errorMessage="Could not search products.">
          {(products) => products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <p>No products found for “{term}”.</p>
          )}
        </CatalogueQueryState>
      ) : (
        <p>Enter a search term to find products.</p>
      )}
    </section>
  );
}
