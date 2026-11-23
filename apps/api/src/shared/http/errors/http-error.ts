export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "HttpError";
  }
}
