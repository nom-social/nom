import { fetchQuery } from "convex/nextjs";
import { api } from "@/../convex/_generated/api";

export async function fetchRepoCount() {
  return fetchQuery(api.repositories.fetchRepoCount);
}

fetchRepoCount.key =
  "src/components/shared/claim-repo-button/actions/fetchRepoCount";
