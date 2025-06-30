import { task } from "@trigger.dev/sdk/v3";

export const sentryErrorTest = task({
  id: "sentry-error-test",
  retry: {
    maxAttempts: 1,
  },
  run: async () => {
    const error = new Error(
      "This is a custom error that Sentry will capture"
    ) as Error & { cause?: unknown };
    error.cause = { additionalContext: "This is additional context" };
    throw error;
  },
});
