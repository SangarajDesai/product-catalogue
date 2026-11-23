import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "../../../shared/components/button";
import { ApiError } from "../../../shared/http/api-client";

type Props<Data> = {
  query: UseQueryResult<Data>;
  loadingMessage: string;
  errorMessage: string;
  children: (data: Data) => ReactNode;
};

export function CatalogueQueryState<Data>({ query, loadingMessage, errorMessage, children }: Props<Data>) {
  if (query.data !== undefined) return children(query.data);
  if (query.isPending) return <p role="status">{loadingMessage}</p>;

  const error = query.error;
  return (
    <div className="catalogue-request-error">
      <p role="alert">{error instanceof ApiError ? error.message : errorMessage}</p>
      {error instanceof ApiError && error.requestId && <p>Request ID: {error.requestId}</p>}
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>Try again</Button>
    </div>
  );
}
