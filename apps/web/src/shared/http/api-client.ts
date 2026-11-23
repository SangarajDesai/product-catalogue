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

async function requestApi(path: string, options: RequestInit) {
  const response = await fetch(path, options).catch((error: unknown) => {
    if (options.signal?.aborted) throw error;
    throw new ApiError("Could not reach the API.", "NETWORK_ERROR");
  });

  if (!response.ok) {
    const requestId = response.headers.get("X-Request-Id") ?? undefined;
    const result = errorResponseSchema.safeParse(await readJson(response));
    if (result.success) {
      const { message, code, requestId: errorId } = result.data.error;
      throw new ApiError(message, code, requestId ?? errorId);
    }
    throw new ApiError("The API request failed.", "HTTP_ERROR", requestId);
  }

  return response;
}

function invalidResponse(response: Response) {
  return new ApiError("The API returned an invalid response.", "INVALID_RESPONSE", response.headers.get("X-Request-Id") ?? undefined);
}

export async function getJson<T>(path: string, schema: ZodType<T>, signal?: AbortSignal) {
  const response = await requestApi(path, { headers: { Accept: "application/json" }, signal });
  const result = schema.safeParse(await readJson(response));
  if (!result.success) {
    throw invalidResponse(response);
  }
  return result.data;
}

export async function postNoContent(path: string, body: object) {
  const response = await requestApi(path, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status !== 204) throw invalidResponse(response);
}
