import { api } from "@/../convex/_generated/api";

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

// Re-export api refs for use in the activity card component
export { api };
