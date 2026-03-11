---
name: nom
description: >
  Fetch recent GitHub activity from the Nom feed at nomit.dev.
  Use when asked to check recent PRs, issues, releases, or pushes from a GitHub
  org or repo, or to search the global feed. Supports filtering by org, repo,
  event type, date range, and free text. Can return JSON or RSS.
---

Fetch GitHub activity from Nom (nomit.dev) and present it clearly.

Base URL: `https://nomit.dev`

## Endpoints

**Global feed**

```
GET /api/feed
```

**Repo feed**

```
GET /api/feed/{org}/{repo}
```

**Global RSS**

```
GET /api/feed/rss
```

**Repo RSS**

```
GET /api/feed/{org}/{repo}/rss
```

No authentication required. All endpoints are public.

## Query parameters

| Parameter | Default | Max | Notes                   |
| --------- | ------- | --- | ----------------------- |
| `limit`   | 20      | 100 |                         |
| `offset`  | 0       | —   | Pagination              |
| `q`       | —       | —   | See filter syntax below |

### Filter syntax for `q` (global feed only)

Combine one or more prefixes, then optionally add free text:

```
org:vercel
repo:next.js
type:pull_request          # pull_request | issue | release | push
from:2026-01-01            # ISO 8601
to:2026-02-01
```

Example: `q=type:pull_request org:vercel from:2026-01-01`

For the repo feed (`/api/feed/{org}/{repo}`), `q` is free-text search only (no prefixes needed).

## Response shape

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "pull_request",
      "org": "vercel",
      "repo": "next.js",
      "title": "Add turbo support",
      "summary": "AI-generated one-paragraph summary",
      "url": "https://github.com/vercel/next.js/pull/123",
      "author": "timneutkens",
      "contributors": ["timneutkens", "shuding"],
      "updated_at": "2026-02-18T12:00:00Z"
    }
  ],
  "pagination": { "offset": 0, "limit": 20, "has_more": true }
}
```

## Presentation

For each item show:

- Type label: **PR** / **Issue** / **Release** / **Push**
- Title as a markdown link to `url`
- One-line `summary`
- `author` · relative timestamp

```
**PR** [Add turbo support](https://github.com/vercel/next.js/pull/123)
timneutkens · 2 hours ago
Adds experimental Turbo support to the build pipeline, cutting build times by ~40%.
```

## Input validation

- `org` and `repo` must match `^[a-zA-Z0-9][\w.-]*$`. Reject invalid input.
- URL-encode all query param values.
- Clamp `limit` to 1–100.
