export const ISSUE_SUMMARY_PROMPT = `Read this GitHub issue and its comments, and write a friendly, concise summary (1-3 sentences) that captures the main point, discussion, and any important context. 

Here's the issue:
Title: {title}
Author: {author}
Description: {body}

Comments:
{comments}

Focus on:
- What is the issue about?
- How does this issue affect the project?
- Any consensus, solutions, conclusions, or next steps?

Keep it short, clear, and helpful for a timeline feed.

Do not include a "Summary" heading or title in your response.`;
