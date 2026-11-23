import { Link, Outlet, useMatch, useSearchParams } from "react-router";
import { FeatureErrorBoundary } from "../../shared/components/feature-error-boundary";
import { CatalogueSearchForm } from "./components/catalogue-search-form";
import { CategoryNavigation } from "./components/category-navigation";
import "./catalogue.css";

export function CatalogueLayout() {
  const searchPage = useMatch("/search");
  const [params] = useSearchParams();
  const submittedTerm = searchPage ? (params.get("q") ?? "").trim() : "";

  return (
    <>
      <h1 className="catalogue-title"><Link to="/">Product catalogue</Link></h1>
      <FeatureErrorBoundary message="Could not display the catalogue.">
        <div className="catalogue-navigation">
          <CatalogueSearchForm key={submittedTerm} submittedTerm={submittedTerm} />
          <CategoryNavigation />
        </div>
        <Outlet />
      </FeatureErrorBoundary>
    </>
  );
}
