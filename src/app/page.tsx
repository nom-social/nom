import ClaimRepoButton from "@/components/shared/claim-repo-button";
import Feed from "./page/feed";

export default function Home() {
  return (
    <div className="px-2 flex flex-col gap-4">
      <ClaimRepoButton />
      <Feed />
    </div>
  );
}
