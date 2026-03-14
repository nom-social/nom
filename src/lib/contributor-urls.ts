const AVATAR_OVERRIDES: Record<string, string> = {
  "github-actions[bot]": "https://avatars.githubusercontent.com/u/44036562",
  "dependabot[bot]": "https://avatars.githubusercontent.com/u/27347476",
  "renovate[bot]": "https://avatars.githubusercontent.com/u/38656520",
};

const PROFILE_URL_OVERRIDES: Record<string, string> = {
  "github-actions[bot]": "https://github.com/actions",
  "dependabot[bot]": "https://github.com/dependabot",
  "renovate[bot]": "https://github.com/renovatebot",
};

export function avatarUrl(login: string): string {
  return AVATAR_OVERRIDES[login] ?? `https://github.com/${login}.png`;
}

export function profileUrl(login: string): string {
  return (
    PROFILE_URL_OVERRIDES[login] ??
    `https://github.com/${encodeURIComponent(login)}`
  );
}
