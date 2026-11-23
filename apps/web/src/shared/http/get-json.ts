import type { ZodType } from "zod";
import { errorResponseSchema } from "./schemas/error-response.schema";

export class ApiError extends Error {
  constructor(message: string, readonly code: string, readonly requestId?: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function readJson(response: Response): Promise<unknown> {
  const mimeType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mimeType === "application/json" || mimeType?.endsWith("+json")) {
    return response.json().catch(() => undefined);
  }
}

export async function getJson<T>(path: string, schema: ZodType<T>, signal?: AbortSignal) {
  const response = await fetch(path, { headers: { Accept: "application/json" }, signal }).catch((error: unknown) => {
    if (signal?.aborted) throw error;
    throw new ApiError("Could not reach the API.", "NETWORK_ERROR");
  });
  const requestId = response.headers.get("X-Request-Id") ?? undefined;
  const body = await readJson(response);

  if (!response.ok) {
    const result = errorResponseSchema.safeParse(body);
    if (result.success) {
      const { message, code, requestId: errorId } = result.data.error;
      throw new ApiError(message, code, requestId ?? errorId);
    }
    throw new ApiError("The API request failed.", "HTTP_ERROR", requestId);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError("The API returned an invalid response.", "INVALID_RESPONSE", requestId);
  }
  return result.data;
}
