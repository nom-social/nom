![Nom Banner](./assets/header.png)

# Nom

[![Nom Badge](https://nomit.dev/nom-badge.svg)](https://nomit.dev/nom-social/nom)
[![License](https://img.shields.io/github/license/nom-social/nom)](./LICENSE)
[![Contributing](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Nom is a social feed for your open source project.** It turns raw GitHub activity — pull requests, issues, releases, and comments — into readable, shareable updates for your community.

## The Problem

GitHub activity is noisy. Watching a repository gives you a firehose of raw events. Following a project's progress means constantly scanning issues, PRs, and releases to piece together what's actually happening. There's no easy way to share your project's story as it unfolds.

## What Nom Does

Nom connects to your GitHub repositories and uses AI to transform raw events into clear, human-readable feed posts — like a changelog that writes itself. Each update captures what changed, why it matters, and links back to the source. Community members can follow your project's feed without needing to watch the repo directly.

- **AI-generated summaries** of PRs, issues, releases, and comments — with configurable tone and style per event type ([see example](.nom/pull_request_instructions.md))
- **Social feed** — follow repositories, discover projects, and stay up to date in one place
- **Real-time updates** — new GitHub events appear in the feed as they happen
- **Self-hostable** — run your own instance with your own data

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Database & Auth | [Supabase](https://supabase.com/) |
| Background Jobs | [Trigger.dev](https://trigger.dev/) |
| Data Fetching | [Tanstack Query](https://tanstack.com/query/latest) |
| AI | [OpenAI](https://openai.com/) / [OpenRouter](https://openrouter.ai/) via [Vercel AI SDK](https://sdk.vercel.ai/) |
| Web Search | [Tavily](https://tavily.com/) |
| Email | [Resend](https://resend.com/) |
| Validation | [Zod](https://zod.dev/) |

## Getting Started

The quickest way to use Nom is to install the hosted GitHub App:

[**Install the Nom GitHub App →**](https://github.com/apps/nom-social-club/installations/new)

Once installed, your project's activity will appear in your feed at [nomit.dev](https://nomit.dev).

## Running Locally

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full local development setup, including:

- Prerequisites (Node.js, Docker)
- Supabase local setup
- Trigger.dev background jobs
- Environment variable configuration

### Quick Start

```sh
# 1. Clone the repo
git clone https://github.com/nom-social/nom.git
cd nom

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see .env.example for descriptions)

# 4. Start Supabase locally
npx supabase start
npx supabase db reset

# 5. Start background jobs
npm run trigger:dev

# 6. Start the app
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Customizing AI Instructions

Nom uses per-event AI instructions stored in your repository's `.nom/` directory. You can customize how your project's activity is summarized by editing these files:

- `.nom/pull_request_instructions.md`
- `.nom/push_instructions.md`
- `.nom/release_instructions.md`

See the [example instructions](.nom/pull_request_instructions.md) in this repo.

## Contributing

We welcome contributions of all kinds — bug reports, feature requests, documentation improvements, and code changes.

**[Read CONTRIBUTING.md →](./CONTRIBUTING.md)**

To get started:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request

## License

[Apache 2.0](./LICENSE)
