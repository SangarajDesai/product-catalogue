import { useQuery } from "@tanstack/react-query";
import { Button } from "../../shared/components/button";
import { FeatureErrorBoundary } from "../../shared/components/feature-error-boundary";
import { ApiError } from "../../shared/http/get-json";
import { getFeaturedProducts } from "./api/featured-products";
import { ProductCard } from "./components/product-card";
import "./featured-home.css";

function FeaturedProducts() {
  const query = useQuery({
    queryKey: ["catalogue", "featured"],
    queryFn: ({ signal }) => getFeaturedProducts(signal),
    retry: false,
  });

  if (query.isPending) return <p role="status">Loading featured products…</p>;

  if (query.isError && !query.data) {
    const error = query.error;
    return (
      <div className="catalogue-request-error">
        <p role="alert">{error instanceof ApiError ? error.message : "Could not load featured products."}</p>
        {error instanceof ApiError && error.requestId && <p>Request ID: {error.requestId}</p>}
        <Button disabled={query.isFetching} onClick={() => void query.refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <ul className="featured-products" role="list">
      {query.data?.map((product) => <li key={product.id}><ProductCard {...product} /></li>)}
    </ul>
  );
}

export function FeaturedHome() {
  return (
    <section className="featured-home" aria-labelledby="featured-heading">
      <h2 id="featured-heading">Featured products</h2>
      <FeatureErrorBoundary message="Could not display featured products.">
        <FeaturedProducts />
      </FeatureErrorBoundary>
    </section>
  );
}
