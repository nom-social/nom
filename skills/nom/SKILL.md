---
description: "Fetch recent GitHub activity from the Nom feed"
argument-hint: "[org/repo] [--search QUERY] [--type TYPE] [--limit N]"
allowed-tools: ["Bash(curl:*)"]
---

Fetch GitHub activity from nomit.dev and present it clearly.

$ARGUMENTS parsing rules:

- If the first argument looks like `org/repo` (contains `/`), fetch that repo's feed at `https://nomit.dev/api/feed/{org}/{repo}`
- Otherwise use the global feed at `https://nomit.dev/api/feed`
- `--search TEXT` maps to `q=TEXT` query param
- `--type TYPE` maps to `q=type:TYPE` (valid types: pull_request, issue, release, push)
- `--limit N` maps to `limit=N` (default 10)
- Combine `--search` and `--type` by joining them: `q=type:TYPE TEXT`

API endpoints:

- Global feed: https://nomit.dev/api/feed
- Repo feed: https://nomit.dev/api/feed/{org}/{repo}

Use curl to fetch the JSON response, then present the results as a clean readable summary. For each item show:

- Event type label (PR / Issue / Release / Push)
- Title as a markdown link to the URL
- One-line AI summary
- Author and timestamp (relative if possible)

Example output format:

```
**PR** [Add turbo support](https://github.com/vercel/next.js/pull/123)
timneutkens · 2 hours ago
Adds experimental Turbo support to the build pipeline, cutting build times by ~40%.

**Release** [v14.2.0](https://github.com/vercel/next.js/releases/tag/v14.2.0)
vercel-release-bot · 1 day ago
Major release introducing partial pre-rendering and improved image optimisation.
```
