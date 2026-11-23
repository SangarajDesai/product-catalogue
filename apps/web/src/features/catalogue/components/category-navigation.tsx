import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router";
import { getCategories } from "../api/catalogue-browsing";
import { CatalogueQueryState } from "./catalogue-query-state";

export function CategoryNavigation() {
  const query = useQuery({
    queryKey: ["catalogue", "categories"],
    queryFn: ({ signal }) => getCategories(signal),
    retry: false,
  });

  return (
    <nav className="category-navigation" aria-label="Categories">
      <CatalogueQueryState query={query} loadingMessage="Loading categories…" errorMessage="Could not load categories.">
        {(categories) => (
          <ul role="list">
            {categories.map(({ slug, name }) => (
              <li key={slug}><NavLink to={`/categories/${slug}`}>{name}</NavLink></li>
            ))}
          </ul>
        )}
      </CatalogueQueryState>
    </nav>
  );
}
