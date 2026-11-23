import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "../shared/components/button";
import { ApiError, getJson } from "../shared/http/get-json";

const readinessResponse = z.object({ status: z.literal("ok") });

export function ApiReadiness() {
  const readiness = useQuery({
    queryKey: ["api-readiness"],
    queryFn: ({ signal }) => getJson("/api/health", readinessResponse, signal),
    retry: false,
  });

  if (readiness.isFetching) return <p role="status">Checking the API…</p>;
  if (readiness.isSuccess) return <p role="status">API is ready.</p>;

  const error = readiness.error;
  return (
    <section>
      <p role="alert">{error instanceof ApiError ? error.message : "The API is unavailable."}</p>
      {error instanceof ApiError && error.requestId && <p>Request ID: {error.requestId}</p>}
      <Button onClick={() => void readiness.refetch()}>Try again</Button>
    </section>
  );
}
