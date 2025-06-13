import { GitHubWebhookPayload } from "@/app/api/webhooks/github/schemas";

export async function processStarEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "star" }>
) {
  throw new Error(
    `Star event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processPullRequestEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "pull_request" }>
) {
  throw new Error(
    `Pull request event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processPullRequestReviewEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "pull_request_review" }>
) {
  throw new Error(
    `Pull request review event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processIssuesEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "issues" }>
) {
  throw new Error(
    `Issues event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processReleaseEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "release" }>
) {
  throw new Error(
    `Release event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processIssueCommentEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "issue_comment" }>
) {
  throw new Error(
    `Issue comment event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processPullRequestReviewCommentEvent(
  event: Extract<
    GitHubWebhookPayload,
    { event_type: "pull_request_review_comment" }
  >
) {
  throw new Error(
    `Pull request review comment event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processPushEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "push" }>
) {
  throw new Error(
    `Push event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processStatusEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "status" }>
) {
  throw new Error(
    `Status event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processCreateEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "create" }>
) {
  throw new Error(
    `Create event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processDeleteEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "delete" }>
) {
  throw new Error(
    `Delete event processing not implemented for repository: ${event.repository.full_name}`
  );
}

// Helper function to process any event type
export async function processEvent(event: GitHubWebhookPayload) {
  switch (event.event_type) {
    case "star":
      return processStarEvent(event);
    case "pull_request":
      return processPullRequestEvent(event);
    case "pull_request_review":
      return processPullRequestReviewEvent(event);
    case "issues":
      return processIssuesEvent(event);
    case "release":
      return processReleaseEvent(event);
    case "issue_comment":
      return processIssueCommentEvent(event);
    case "pull_request_review_comment":
      return processPullRequestReviewCommentEvent(event);
    case "push":
      return processPushEvent(event);
    case "status":
      return processStatusEvent(event);
    case "create":
      return processCreateEvent(event);
    case "delete":
      return processDeleteEvent(event);
    default:
      const unknownEvent = event as { event_type: string };
      throw new Error(`Unknown event type: ${unknownEvent.event_type}`);
  }
}
