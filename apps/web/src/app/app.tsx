import { Link, Route, Routes } from "react-router";
import { CatalogueLayout } from "../features/catalogue/catalogue-layout";
import { CategoryPage } from "../features/catalogue/category-page";
import { FeaturedHome } from "../features/catalogue/featured-home";
import { ProductPage } from "../features/catalogue/product-page";
import { SearchPage } from "../features/catalogue/search-page";
import { ProductEnquiry } from "../features/enquiry/product-enquiry";

export function App() {
  return (
    <main className="shell">
      <Routes>
        <Route element={<CatalogueLayout />}>
          <Route path="/" element={<FeaturedHome />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products/:id" element={
            <ProductPage renderEnquiry={(productId) => <ProductEnquiry key={productId} productId={productId} />} />
          } />
        </Route>
        <Route path="*" element={
          <>
            <h1>Page not found</h1>
            <Link to="/">Return to the catalogue</Link>
          </>
        } />
      </Routes>
    </main>
  );
}
