export const RELEASE_SUMMARY_PROMPT = `Read this GitHub release and write a friendly, concise summary (1-3 sentences) that captures:
- What changed in this release?
- How does it impact the project?
- How does it affect users or integrators?
- Is this a bug fix, feature release, or both?

You can use explore_file with ref={tag_name} to read files at the release tag, or get_pull_request if you need PR context. Only call tools if you need more context.

Here is the release info:
Tag: {tag_name}
Name: {name}
Author: {author}
Published at: {published_at}
Release notes:
{body}

Do not include a heading or title in your response. Just write the summary in plain language, clear and helpful for a timeline feed.`;
