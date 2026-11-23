import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../shared/components/button";

export function CatalogueSearchForm({ submittedTerm }: { submittedTerm: string }) {
  const [term, setTerm] = useState(submittedTerm);
  const navigate = useNavigate();
  const trimmedTerm = term.trim();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTerm) return;

    setTerm(trimmedTerm);
    const params = new URLSearchParams({ q: trimmedTerm });
    void navigate(`/search?${params}`);
  }

  return (
    <form className="catalogue-search" role="search" onSubmit={submit}>
      <label htmlFor="catalogue-search-term" className="visually-hidden">Search products</label>
      <input
        id="catalogue-search-term"
        type="search"
        placeholder="Search products"
        value={term}
        onChange={(event) => setTerm(event.currentTarget.value)}
      />
      <Button type="submit" disabled={!trimmedTerm}>Search</Button>
    </form>
  );
}
