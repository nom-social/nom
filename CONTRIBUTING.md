# Contributing to Nom

Thank you for your interest in contributing to Nom! 🎉

We welcome all kinds of contributions, including bug reports, feature requests, documentation improvements, and code changes.

## How to Contribute

1. **Fork the repository** and create your branch from `main` or the relevant feature branch.
2. **Make your changes** with clear, descriptive commit messages.
3. **Test your changes** to ensure nothing is broken.
4. **Open a Pull Request** with a clear description of your changes and why they are needed.

## Code Style

- Follow the existing code style and conventions.
- Run `vlt lint` before submitting your PR.

## Reporting Issues

- Use [GitHub Issues](../../issues) to report bugs or request features.
- Please provide as much detail as possible.

## Need Help?

If you have questions, feel free to open an issue or start a discussion.

Thanks for helping make Nom better! 🚀

# Local development
## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v22+ recommended)
- **Docker** (for local Supabase)

## Environment Variables

Before running the application, copy the example environment file and fill in the required values:

```sh
cp .env.sample .env.local
```

Then, open `.env.local` and fill in the required variables.

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Setup Supabase (Local Development)

We use [Supabase](https://supabase.com/) for our database and authentication. To run it locally:

1. **Install the Supabase CLI:**

   ```sh
   npm install -g supabase
   ```

2. **Start Supabase locally:**

   ```sh
   npx supabase start
   ```

   This will spin up Supabase using Docker. You can access Supabase Studio at [http://localhost:54323](http://localhost:54323).

3. **Apply database migrations:**

   ```sh
   npx supabase db reset
   ```

   This will reset and migrate your local database to the latest schema.

### 2.1. Migrating Up (Applying New Migrations)

If you make changes to the database schema (for example, by editing files in `supabase/migrations/`), you need to apply these migrations to your local Supabase instance:

```sh
npx supabase db push
```

This command will apply any new migrations to your running local database.

If you want to generate a new migration after making schema changes, use:

```sh
npx supabase migration new <migration_name>
```

Then edit the generated SQL file in `supabase/migrations/`, and run `npx supabase db push` again to apply it.

### 3. Setup Trigger.dev (Background Jobs)

We use [Trigger.dev](https://trigger.dev/) for background jobs and workflows.

1. **Initialize Trigger.dev (if not already):**

   ```sh
   npx trigger.dev@latest init
   ```

   This will set up the config and `/trigger` directory if needed.

2. **Run Trigger.dev in development mode:**

   ```sh
   npx trigger.dev@latest dev
   ```

   This will watch your `/trigger` directory and run background jobs locally.

### 4. Run the Application

Start the Next.js app in development mode:

```sh
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### (Optional) Run Storybook

You can also run Storybook to view and develop UI components in isolation:

```sh
npm run storybook
```

Storybook will be available at [http://localhost:6006](http://localhost:6006).

---

## Useful Links

- [Supabase Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Trigger.dev Quick Start](https://trigger.dev/docs/quick-start)
- [vlt Package Manager](https://vlt.dev/)
