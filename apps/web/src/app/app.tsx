import { Link, Route, Routes } from "react-router";
import { FeaturedHome } from "../features/catalogue/featured-home";

export function App() {
  return (
    <main className="shell">
      <Routes>
        <Route path="/" element={
          <>
            <h1>Product catalogue</h1>
            <FeaturedHome />
          </>
        } />
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
