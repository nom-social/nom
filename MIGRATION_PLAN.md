# Migration Plan: Supabase → Convex

## Overview

This document outlines the plan to migrate the `nom` application from Supabase (PostgreSQL + Supabase Auth + PostgREST) to [Convex](https://convex.dev). Convex replaces the database, auth, and query layer with a TypeScript-native reactive backend.

---

## Table of Contents

1. [What's Changing](#1-whats-changing)
2. [Convex Schema Design](#2-convex-schema-design)
3. [Auth Migration](#3-auth-migration)
4. [Query & Mutation Migration](#4-query--mutation-migration)
5. [Full-Text Search Migration](#5-full-text-search-migration)
6. [Background Jobs (Trigger.dev)](#6-background-jobs-triggerdev)
7. [API Routes](#7-api-routes)
8. [Data Migration Script](#8-data-migration-script)
9. [Environment Variables](#9-environment-variables)
10. [File Deletions & Cleanups](#10-file-deletions--cleanups)
11. [Phased Rollout](#11-phased-rollout)
12. [Risk & Rollback](#12-risk--rollback)

---

## 1. What's Changing

| Supabase Concept | Convex Equivalent |
|---|---|
| PostgreSQL tables | Convex documents (collections) |
| Supabase Auth (GitHub OAuth) | Convex Auth (`@convex-dev/auth`) with GitHub provider |
| PostgREST query builder | Convex queries & mutations (TypeScript functions) |
| Row Level Security (RLS) | Access control inside Convex query/mutation functions |
| PostgreSQL full-text search (`tsvector`) | Convex search indexes |
| SQL triggers for `search_vector` | Convex mutations that update `searchText` inline |
| RPC functions (`get_batch_like_data`) | Convex queries |
| Upsert with `onConflict` | Convex `patch` / conditional `insert` via `db.query` |
| `@supabase/ssr` cookie session | Convex Auth JWT session (handled by `ConvexAuthNextjsServerProvider`) |

**What is NOT changing:**
- Trigger.dev background job framework (only the Supabase client calls inside tasks change)
- Next.js app structure, components, and UI
- GitHub webhook ingestion endpoint
- Resend email sending
- PostHog analytics

---

## 2. Convex Schema Design

### Installation

```bash
npm install convex @convex-dev/auth
npx convex dev  # initializes convex/ directory
```

### `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables, // users, sessions, accounts, verificationCodes tables

  // Extends the built-in users table
  users: defineTable({
    githubUsername: v.string(),
    email: v.string(),
    // authTables provides: name, email, image, emailVerificationTime, etc.
  })
    .index("by_github_username", ["githubUsername"])
    .index("by_email", ["email"]),

  repositories: defineTable({
    org: v.string(),
    repo: v.string(),
    metadata: v.optional(v.any()),
    championGithubUsername: v.optional(v.string()),
    isPrivate: v.boolean(),
    createdAt: v.number(), // Unix ms timestamp
  })
    .index("by_org_repo", ["org", "repo"])
    .index("by_champion", ["championGithubUsername"]),

  repositoriesSecure: defineTable({
    repositoryId: v.id("repositories"),
    installationId: v.number(),
    createdAt: v.number(),
  }).index("by_repository", ["repositoryId"]),

  repositoriesUsers: defineTable({
    repositoryId: v.id("repositories"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_repository", ["repositoryId"])
    .index("by_user_repository", ["userId", "repositoryId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_repository", ["repositoryId"])
    .index("by_user_repository", ["userId", "repositoryId"]),

  publicTimeline: defineTable({
    repositoryId: v.id("repositories"),
    data: v.any(),
    type: v.string(),
    score: v.number(),
    isRead: v.boolean(),
    categories: v.optional(v.array(v.string())),
    snoozeTo: v.optional(v.number()),
    searchText: v.optional(v.string()),
    eventIds: v.optional(v.array(v.string())),
    dedupeHash: v.string(),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_dedupe_hash", ["dedupeHash"])
    .index("by_repository", ["repositoryId"])
    .index("by_updated_at", ["updatedAt"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["type", "repositoryId"],
    }),

  userTimeline: defineTable({
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    data: v.any(),
    type: v.string(),
    score: v.number(),
    isRead: v.boolean(),
    categories: v.optional(v.array(v.string())),
    snoozeTo: v.optional(v.number()),
    searchText: v.optional(v.string()),
    eventIds: v.optional(v.array(v.string())),
    dedupeHash: v.string(),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated_at", ["userId", "updatedAt"])
    .index("by_user_dedupe_hash", ["userId", "dedupeHash"])
    .index("by_dedupe_hash", ["dedupeHash"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["userId", "type", "repositoryId"],
    }),

  githubEventLog: defineTable({
    eventType: v.string(),
    action: v.optional(v.string()),
    org: v.string(),
    repo: v.string(),
    rawPayload: v.any(),
    lastProcessed: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_org_repo_unprocessed", ["org", "repo", "lastProcessed"])
    .index("by_last_processed", ["lastProcessed"]),

  timelineLikes: defineTable({
    userId: v.id("users"),
    dedupeHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_dedupe_hash", ["userId", "dedupeHash"])
    .index("by_dedupe_hash", ["dedupeHash"]),

  notifications: defineTable({
    type: v.string(),
    entityId: v.string(),
    key: v.string(),
    createdAt: v.number(),
  }).index("by_type_entity_key", ["type", "entityId", "key"]),
});
```

### Key schema decisions

- **`_id` replaces UUIDs** — Convex auto-generates `_id` (type `Id<"tableName">`). The Supabase `uuid` primary keys are replaced by Convex document IDs.
- **Timestamps as `v.number()`** — Convex stores timestamps as Unix milliseconds (`Date.now()`). Supabase used ISO strings.
- **`search_vector` tsvector dropped** — Replaced by Convex `searchIndex` which handles tokenization automatically.
- **`authTables`** — `@convex-dev/auth` injects its own `users`, `sessions`, and `accounts` tables. The project's extra user fields (`githubUsername`, `email`) get merged into the `users` table via the `Users` profile extension.

---

## 3. Auth Migration

### Current (Supabase)
- GitHub OAuth via `@supabase/ssr`
- Cookie-based session management
- `createClient()` / `createServerClient()` from `@supabase/ssr`
- Auth callback at `/auth/callback/route.ts`

### New (Convex Auth)

**Install:**
```bash
npm install @convex-dev/auth @auth/core
```

**`convex/auth.ts`:**
```typescript
import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [GitHub],
});
```

**`convex/http.ts`:**
```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);
export default http;
```

**Next.js App Router integration:**

Replace `src/utils/supabase/server.ts` with Convex Auth middleware:

```typescript
// middleware.ts
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
export default convexAuthNextjsMiddleware();
export const config = { matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"] };
```

**Root layout:**
```tsx
// src/app/layout.tsx
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ConvexAuthNextjsServerProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
```

**Replacing `src/app/auth/callback/route.ts`:**

The OAuth callback is handled automatically by Convex Auth's HTTP router. The post-login user upsert logic (linking champion repos, creating `repositoriesUsers`) moves to a Convex mutation triggered after sign-in via `createOrUpdateUser` hook:

```typescript
// convex/auth.ts (extended)
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [GitHub],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile, provider }) {
      if (existingUserId) return existingUserId;

      const userId = await ctx.db.insert("users", {
        githubUsername: profile.login as string,
        email: profile.email as string,
      });

      // Link champion repos
      const championedRepos = await ctx.db
        .query("repositories")
        .withIndex("by_champion", (q) =>
          q.eq("championGithubUsername", profile.login as string)
        )
        .collect();

      await Promise.all(
        championedRepos.map(async (repo) => {
          await ctx.db.patch(repo._id, { championGithubUsername: undefined });
          const existing = await ctx.db
            .query("repositoriesUsers")
            .withIndex("by_user_repository", (q) =>
              q.eq("userId", userId).eq("repositoryId", repo._id)
            )
            .unique();
          if (!existing) {
            await ctx.db.insert("repositoriesUsers", {
              userId,
              repositoryId: repo._id,
              createdAt: Date.now(),
            });
          }
        })
      );

      return userId;
    },
  },
});
```

**Reading current user (server):**
```typescript
import { auth } from "@convex-dev/auth/nextjs/server";

const { userId } = await auth(); // replaces supabase.auth.getUser()
```

**Reading current user (client):**
```typescript
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";

const { isAuthenticated } = useConvexAuth();
const user = useQuery(api.users.getCurrentUser);
```

---

## 4. Query & Mutation Migration

### Utility client replacements

| Old file | New replacement |
|---|---|
| `src/utils/supabase/client.ts` | `import { useQuery, useMutation } from "convex/react"` |
| `src/utils/supabase/server.ts` | `import { fetchQuery, fetchMutation } from "convex/nextjs"` |
| `src/utils/supabase/admin.ts` | Direct `ctx.db` usage inside Convex functions (no separate admin client) |

### Feed queries (`src/app/page/feed/actions.ts`)

**Old (Supabase PostgREST):**
```typescript
const { data } = await supabase
  .from("user_timeline")
  .select("*, repositories!inner ( org, repo )")
  .eq("user_id", user.id)
  .textSearch("search_vector", query, { type: "websearch", config: "english" })
  .order("updated_at", { ascending: false })
  .range(offset, offset + limit - 1);
```

**New (`convex/feed.ts`):**
```typescript
// convex/feed.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const fetchUserFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    textQuery: v.optional(v.string()),
    type: v.optional(v.string()),
    org: v.optional(v.string()),
    repo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let q = args.textQuery
      ? ctx.db
          .query("userTimeline")
          .withSearchIndex("search_text", (q) =>
            q.search("searchText", args.textQuery!).eq("userId", userId)
          )
      : ctx.db
          .query("userTimeline")
          .withIndex("by_user_updated_at", (q) => q.eq("userId", userId))
          .order("desc");

    const page = await q.paginate(args.paginationOpts);

    // Join repository data
    const items = await Promise.all(
      page.page.map(async (item) => {
        const repository = await ctx.db.get(item.repositoryId);
        return { ...item, repository };
      })
    );

    return { ...page, page: items };
  },
});
```

> **Note on full-text search filters**: Convex search indexes support one `search()` call and up to 16 `eq()` filters. Multi-filter text queries (e.g., filter by `type` AND `org` AND text) may require running multiple queries and merging results in-memory, or adding filter fields to the search index.

### Like operations (`src/components/shared/activity-card/actions.ts`)

**Old `get_batch_like_data` RPC → New Convex query:**
```typescript
// convex/likes.ts
export const getBatchLikeData = query({
  args: {
    dedupeHashes: v.array(v.string()),
  },
  handler: async (ctx, { dedupeHashes }) => {
    const userId = await getAuthUserId(ctx);

    return Promise.all(
      dedupeHashes.map(async (hash) => {
        const likes = await ctx.db
          .query("timelineLikes")
          .withIndex("by_dedupe_hash", (q) => q.eq("dedupeHash", hash))
          .collect();

        const userLiked = userId
          ? likes.some((l) => l.userId === userId)
          : false;

        return { dedupeHash: hash, likeCount: likes.length, userLiked };
      })
    );
  },
});
```

### Subscription management

```typescript
// convex/subscriptions.ts
export const subscribe = mutation({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_repository", (q) =>
        q.eq("userId", userId).eq("repositoryId", repositoryId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("subscriptions", {
        userId,
        repositoryId,
        createdAt: Date.now(),
      });
    }
  },
});

export const unsubscribe = mutation({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_repository", (q) =>
        q.eq("userId", userId).eq("repositoryId", repositoryId)
      )
      .unique();

    if (sub) await ctx.db.delete(sub._id);
  },
});
```

### Upsert pattern (deduplication)

Convex has no native upsert. The pattern is:
```typescript
async function upsertPublicTimeline(ctx, entry) {
  const existing = await ctx.db
    .query("publicTimeline")
    .withIndex("by_dedupe_hash", (q) => q.eq("dedupeHash", entry.dedupeHash))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { ...entry, updatedAt: Date.now() });
  } else {
    await ctx.db.insert("publicTimeline", {
      ...entry,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}
```

### Access control (replacing RLS)

Access checks move into each query/mutation function body instead of database-level policies:

```typescript
// Example: users can only read their own user_timeline
export const getUserTimeline = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    // Index guarantees we only return this user's rows
    return ctx.db.query("userTimeline").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  },
});
```

For service-role operations (webhooks, background jobs), use Convex internal mutations:
```typescript
// convex/internal/githubEvents.ts
import { internalMutation } from "../_generated/server";

export const insertGithubEvent = internalMutation({
  args: { ... },
  handler: async (ctx, args) => { ... },
});
```

Internal functions can only be called from other Convex functions or via the Convex Node.js client with a deploy key — never from the browser.

---

## 5. Full-Text Search Migration

### Old approach
- PostgreSQL `tsvector` columns with GIN indexes
- SQL triggers auto-updating `search_vector` on INSERT/UPDATE
- `extract_timeline_search_text()` SQL function extracting title/summary

### New approach
- Convex `searchIndex` with a `searchText` string field
- `searchText` populated inline during `insert`/`patch` operations
- Extract function moves to TypeScript (`convex/lib/extractSearchText.ts`)

```typescript
// convex/lib/extractSearchText.ts
export function extractTimelineSearchText(
  data: Record<string, unknown>,
  type: string
): string {
  switch (type) {
    case "pull_request": {
      const pr = (data as any).pull_request;
      return [pr?.title, pr?.body].filter(Boolean).join(" ");
    }
    case "issue": {
      const issue = (data as any).issue;
      return [issue?.title, issue?.body].filter(Boolean).join(" ");
    }
    case "release": {
      const release = (data as any).release;
      return [release?.name, release?.body].filter(Boolean).join(" ");
    }
    case "push": {
      return ((data as any).commits || [])
        .map((c: any) => c.message)
        .join(" ");
    }
    default:
      return "";
  }
}
```

Then in the upsert mutation:
```typescript
import { extractTimelineSearchText } from "./lib/extractSearchText";

const searchText = extractTimelineSearchText(entry.data, entry.type);
await ctx.db.insert("publicTimeline", { ...entry, searchText });
```

**Limitation**: Convex search does not support PostgreSQL's `websearch_to_tsquery` syntax (operators like `AND`, `OR`, `-term`). Simple keyword search works well. Advanced operators will need to be parsed and handled manually or simplified to basic phrase search.

---

## 6. Background Jobs (Trigger.dev)

Trigger.dev tasks currently use `createAdminClient()` (Supabase service role) for all database access. These calls are replaced with the Convex Node.js client using a deploy key.

### Setup

```bash
npm install convex
```

```typescript
// src/utils/convex/admin.ts  (replaces src/utils/supabase/admin.ts)
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";

export const createAdminConvexClient = () =>
  new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
// For internal mutations, use ConvexClient with deploy key:
// new ConvexClient(process.env.CONVEX_URL!, { auth: process.env.CONVEX_DEPLOY_KEY! })
```

> **Important**: Trigger.dev tasks calling Convex **internal** mutations need the `CONVEX_DEPLOY_KEY` (server-to-server). Public mutations/queries can use the regular HTTP client.

### Task migration example: `processGithubEvents`

**Old:**
```typescript
const supabase = createAdminClient();
await supabase.from("github_event_log").select("*").is("last_processed", null)...
await supabase.from("user_timeline").upsert(entries, { onConflict: "user_id,dedupe_hash" });
```

**New:**
```typescript
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { internal } from "@/convex/_generated/api";

const events = await fetchQuery(internal.githubEvents.getUnprocessed, { org, repo });
await fetchMutation(internal.githubEvents.upsertTimelineEntries, { entries });
```

All Trigger.dev tasks need updating:
| Task | Changes |
|---|---|
| `processGithubEvents` | Replace all Supabase queries with Convex internal mutations/queries |
| `newUserSignUpTask` | Replace user lookup + timeline copy with Convex mutation |
| `sendSubscriberMilestoneTask` | Replace notifications upsert and subscriber count query |
| `sendEngagementMilestoneTask` | Replace engagement count query |
| `sendUserRepoHighlightsTask` | Replace timeline query |
| `syncBatchReposMetadataTask` | Replace repository patch |
| `backfillConnectedReposTask` | Replace subscription and repository queries |

---

## 7. API Routes

### GitHub Webhook (`src/app/api/webhooks/github/route.ts`)

**Old:**
```typescript
const supabase = createAdminClient();
await supabase.from("github_event_log").insert({ ... });
```

**New:**
```typescript
import { fetchMutation } from "convex/nextjs";
import { internal } from "@/convex/_generated/api";

await fetchMutation(internal.githubEvents.insert, {
  eventType, action, org, repo, rawPayload, createdAt: Date.now()
});
```

### Feed API routes (`/api/feed`, `/api/feed/rss`)

These call Supabase PostgREST. Replace with `fetchQuery` calls to Convex:

```typescript
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const result = await fetchQuery(api.feed.fetchPublicFeed, { limit, offset });
```

---

## 8. Data Migration Script

A one-time script to export data from Supabase and import into Convex.

### Strategy (from Convex migration guide)

1. Export each Supabase table to JSON via `supabase db dump` or direct PostgreSQL queries
2. Map Supabase UUIDs to Convex IDs (maintain a mapping table during import)
3. Import in dependency order: `repositories` → `users` → `repositoriesSecure`/`repositoriesUsers`/`subscriptions` → `publicTimeline` → `userTimeline` → `githubEventLog` → `timelineLikes` → `notifications`
4. Verify row counts and spot-check data after import

### `scripts/migrate-to-convex.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "@/convex/_generated/api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function migrateRepositories() {
  const { data } = await supabase.from("repositories").select("*");
  const idMap: Record<string, string> = {};

  for (const row of data!) {
    const convexId = await convex.mutation(internal.migration.insertRepository, {
      org: row.org,
      repo: row.repo,
      metadata: row.metadata,
      championGithubUsername: row.champion_github_username ?? undefined,
      isPrivate: row.is_private ?? false,
      createdAt: new Date(row.created_at).getTime(),
    });
    idMap[row.id] = convexId;
  }

  return idMap;
}

// ... repeat for each table, threading idMap through to resolve FK references
```

### ID mapping approach

Since Convex auto-generates document IDs, we need to thread a `uuidToConvexId` map through the migration:

```typescript
// During user_timeline migration:
const convexRepoId = repositoryIdMap[row.repo_id]; // Supabase UUID → Convex Id
const convexUserId = userIdMap[row.user_id];
```

### Cutover window

To minimize downtime:
1. Run migration script while production still points to Supabase (read-only snapshot import)
2. Identify last Supabase event timestamp
3. Put app in maintenance mode (or pause webhook ingestion)
4. Migrate delta (events since snapshot)
5. Swap environment variables to Convex
6. Resume webhooks
7. Monitor for 30 minutes, rollback if errors > threshold

---

## 9. Environment Variables

### Remove
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Add
```
NEXT_PUBLIC_CONVEX_URL=         # from npx convex dev
CONVEX_DEPLOY_KEY=              # for server-side internal mutations
AUTH_GITHUB_ID=                 # GitHub OAuth App client ID
AUTH_GITHUB_SECRET=             # GitHub OAuth App client secret
```

---

## 10. File Deletions & Cleanups

### Delete
```
src/utils/supabase/client.ts
src/utils/supabase/server.ts
src/utils/supabase/admin.ts
src/app/auth/callback/route.ts  # replaced by Convex Auth HTTP handler
supabase/                       # entire directory (migrations, config.toml, seed.sql)
src/types/supabase.ts           # generated types, replaced by convex/_generated/
```

### Update `package.json`
```
Remove: @supabase/ssr, @supabase/supabase-js
Add:    convex, @convex-dev/auth, @auth/core
```

### Update imports project-wide
All `import { createClient } from "@/utils/supabase/client"` → Convex `useQuery`/`useMutation` hooks or `fetchQuery`/`fetchMutation` from `convex/nextjs`.

---

## 11. Phased Rollout

### Phase 1 — Convex Schema + Auth (no data yet)
- [ ] Install `convex`, `@convex-dev/auth`
- [ ] Write `convex/schema.ts`
- [ ] Configure `convex/auth.ts` with GitHub provider
- [ ] Add middleware + layout providers
- [ ] Verify GitHub OAuth sign-in works end-to-end

### Phase 2 — Core Query/Mutation Layer
- [ ] Implement Convex queries for `publicTimeline`, `userTimeline`, `repositories`, `subscriptions`
- [ ] Implement Convex mutations for all writes
- [ ] Replace feed actions (`src/app/page/feed/actions.ts`)
- [ ] Replace subscription actions
- [ ] Replace like actions
- [ ] Replace repository profile actions

### Phase 3 — Background Jobs
- [ ] Add `convex/internal/` functions for all Trigger.dev task operations
- [ ] Update all Trigger.dev tasks to use Convex client
- [ ] Update GitHub webhook API route

### Phase 4 — Data Migration
- [ ] Write and test migration script against a Convex dev deployment
- [ ] Run migration against staging
- [ ] Run migration against production with cutover window

### Phase 5 — Cleanup
- [ ] Delete Supabase utilities and config
- [ ] Remove Supabase environment variables
- [ ] Archive Supabase project

---

## 12. Risk & Rollback

### Key risks

| Risk | Mitigation |
|---|---|
| Full-text search degradation (no `websearch_to_tsquery`) | Implement basic keyword search first; enhance progressively |
| Convex pagination differences vs `range(offset, limit)` | Use Convex cursor-based pagination; update frontend pagination state |
| Convex query limits (1MB response, 8192 documents per query) | Add proper pagination to all feed queries |
| Auth session migration (existing users lose sessions) | Users re-authenticate on first visit; GitHub OAuth re-links accounts by email |
| Background job latency (HTTP client vs pg connection) | Benchmark Trigger.dev → Convex HTTP latency; add retries |

### Rollback plan

- Keep Supabase project active for 30 days post-migration
- Feature flag via env var: `USE_CONVEX=true/false` — if `false`, app falls back to Supabase client
- Database snapshot before migration starts

---

## References

- [Convex Docs](https://docs.convex.dev)
- [Convex Auth](https://labs.convex.dev/auth)
- [Migrate PostgreSQL to Convex](https://stack.convex.dev/migrate-data-postgres-to-convex)
- [Convex Search Indexes](https://docs.convex.dev/text-search)
- [Convex Pagination](https://docs.convex.dev/database/pagination)
- [Next.js + Convex](https://docs.convex.dev/client/react/nextjs)
