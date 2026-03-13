export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}
