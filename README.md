![Nom Banner](./images/header.png)

# Nom

Welcome to the Nom project! This repository powers the Nom social platform, helping you track, share, and celebrate open source activity.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v22+ recommended)
- **Docker** (for local Supabase)

## Environment Variables

Before running the application, copy the example environment file and fill in the required values:

```sh
cp .env.sample .env.local
```

Then, open `.env.local` and fill in the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
OPENAI_API_KEY=""
```

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

## Contributing

We welcome contributions! Please open issues or pull requests for any improvements, bug fixes, or suggestions.

For detailed guidelines, please check out our [CONTRIBUTING.md](./CONTRIBUTING.md) document.
