const AVATAR_OVERRIDES: Record<string, string> = {
  "github-actions[bot]": "https://avatars.githubusercontent.com/u/44036562",
  "dependabot[bot]": "https://avatars.githubusercontent.com/u/27347476",
  "renovate[bot]": "https://avatars.githubusercontent.com/u/38656520",
};

export function avatarUrl(login: string): string {
  return AVATAR_OVERRIDES[login] ?? `https://github.com/${login}.png`;
}
