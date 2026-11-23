import { useQuery } from "@tanstack/react-query";
import { getFeaturedProducts } from "./api/featured-products";
import { CatalogueQueryState } from "./components/catalogue-query-state";
import { ProductGrid } from "./components/product-grid";

export function FeaturedHome() {
  const query = useQuery({
    queryKey: ["catalogue", "featured"],
    queryFn: ({ signal }) => getFeaturedProducts(signal),
    retry: false,
  });

  return (
    <section className="catalogue-page" aria-labelledby="featured-heading">
      <h2 id="featured-heading">Featured products</h2>
      <CatalogueQueryState query={query} loadingMessage="Loading featured products…" errorMessage="Could not load featured products.">
        {(products) => <ProductGrid products={products} />}
      </CatalogueQueryState>
    </section>
  );
}
