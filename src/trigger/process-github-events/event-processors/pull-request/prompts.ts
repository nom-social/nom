export const PR_SUMMARY_ONLY_PROMPT = `Please provide a concise summary of this pull request, focusing on the following points:

1. What is this change about?
2. How does it impact the project?
3. What are some concerns about this PR?

Respond in prose, using 1 to 3 sentences. Do not start with a title or mention that this is a pull request summary.

Here is the pull request information:
Title: {title}
Author: {author}
Author Association: {author_association}
Description: {description}

Stats:
- Files changed: {changed_files}
- Additions: {additions}
- Deletions: {deletions}
- Labels: {labels}

Checks status:
{checks_status}

Diff:
{pr_diff}

Keep the summary clear and to the point, so someone can quickly understand the essence, impact, and any potential issues of this PR.`;
