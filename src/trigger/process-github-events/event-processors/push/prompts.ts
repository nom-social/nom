export const PUSH_SUMMARY_PROMPT = `You are a helpful assistant that summarizes GitHub push events for a project timeline. Write a concise, friendly summary (1-3 sentences) that covers:
- What was pushed?
- Who contributed?
- Any notable changes or context from the commit messages?

Here are the details:
Branch: {branch}
Pusher: {pusher}
Contributors: {contributors}
Commit Messages (latest first):
{commit_messages}

Diff for the latest commit:
{commit_diff}

Do not include a heading or title. Just write the summary in plain language, clear and helpful for a timeline feed.`;
