export const RELEASE_ANALYSIS_PROMPT = `Hey there! 👋 Let's break down this release for someone who uses or integrates this repo. Please give me a JSON response like this:

{
  "summary": "A friendly 2-4 sentence overview of what this release means for users/integrators, in point form",
  "breaking_changes": [
    "List any breaking changes or things that require user action",
    "If none, say 'None'"
  ],
  "notable_additions": [
    "Highlight new features, improvements, or fixes that matter to consumers/integrators"
  ],
  "migration_notes": [
    "Any migration or upgrade steps needed for this release (if any)"
  ]
}

Here's the release info:
- Tag: {tag_name}
- Name: {name}
- Author: {author}
- Published at: {published_at}
- Release notes:
{body}

Focus on what matters to someone using this repo in their project. If there are breaking changes, call them out clearly. If there are new features or fixes, highlight them. If there are upgrade/migration steps, list them. If not, say so. Keep it concise and actionable! 🚀`;
