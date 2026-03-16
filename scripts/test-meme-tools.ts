#!/usr/bin/env npx tsx
/**
 * Smoke-test script for the meme agent tools.
 *
 * Usage:
 *   npm run test:meme
 *
 * No environment variables required.
 * `search_meme_templates` makes a live GET to api.memegen.link/templates.
 * `create_meme` builds the URL locally — no network call.
 */

import { encodeMemeText, buildMemeUrl } from "../src/trigger/shared/agent-tools";

async function searchMemeTemplates(query: string) {
  const res = await fetch("https://api.memegen.link/templates");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const all = (await res.json()) as Array<{ id: string; name: string; example?: { url?: string } }>;
  const q = query.toLowerCase();
  return all
    .filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    .slice(0, 10)
    .map((t) => ({ id: t.id, name: t.name, example_url: t.example?.url ?? "" }));
}

async function main() {
  // 1. Encoding helpers (no network)
  console.log("=== encodeMemeText ===");
  console.log(encodeMemeText("merging on Friday"));   // merging_on_Friday
  console.log(encodeMemeText("100% sure?"));           // 100~p_sure~q

  console.log("\n=== buildMemeUrl ===");
  const url = buildMemeUrl("drake", ["merging on Friday", "reverting on Saturday"]);
  console.log(url);
  // → https://api.memegen.link/images/drake/merging_on_Friday/reverting_on_Saturday.png

  // 2. Live search (requires internet)
  console.log("\n=== search_meme_templates({ query: 'drake' }) ===");
  try {
    const templates = await searchMemeTemplates("drake");
    console.log(JSON.stringify(templates, null, 2));
  } catch (err) {
    console.error("search failed (no internet?):", err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
