import { defineConfig } from "@trigger.dev/sdk/v3";
import { esbuildPlugin } from "@trigger.dev/build/extensions";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";
import * as Sentry from "@sentry/node";

export default defineConfig({
  project: "proj_dbbjgfoapapbbywhkgjq",
  runtime: "node",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
  build: {
    extensions: [
      esbuildPlugin(
        sentryEsbuildPlugin({
          org: "nom-zu",
          project: "nom",
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
        { placement: "last", target: "deploy" }
      ),
    ],
  },
  init: async () => {
    Sentry.init({
      defaultIntegrations: false,
      dsn: process.env.SENTRY_DSN,
      environment:
        process.env.NODE_ENV === "production" ? "production" : "development",
    });
  },
  onFailure: async (payload, error, { ctx }) => {
    Sentry.captureException(error, {
      extra: {
        payload,
        ctx,
      },
    });
  },
});
