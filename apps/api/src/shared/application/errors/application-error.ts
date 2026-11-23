export class ApplicationError extends Error {
  constructor(readonly code: string, options?: ErrorOptions) {
    super(code, options);
    this.name = new.target.name;
  }
}
