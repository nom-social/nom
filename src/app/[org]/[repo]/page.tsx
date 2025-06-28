"use client";

import { useParams } from "next/navigation";
import z from "zod";

import RepoProfileCard from "@/components/[org]/[repo]/repo-profile-card";

// TODO: Add a 404 component in case the repo is not found
// TODO: Implement the repo page
// TODO: Fix up migration and local supabase setup
export default function RepoPage() {
  const params = useParams();
  const repoSchema = z.object({
    org: z.string(),
    repo: z.string(),
  });
  const { org, repo } = repoSchema.parse(params);

  return (
    <div className="flex flex-col justify-center gap-4">
      <RepoProfileCard
        org={org}
        repo={repo}
        createdAt={new Date("2025-06-27")}
        description="A set of beautifully-designed, accessible components and a code distribution platform. Works with your favorite frameworks. Open Source. Open Code."
        websiteUrl="https://ui.shadcn.com/"
        avatarUrl="https://github.com/shadcn.png"
        topLanguages={[
          { name: "TypeScript", color: "#2b7489" },
          { name: "JavaScript", color: "#f1e05a" },
          { name: "CSS", color: "#563d7c" },
        ]}
        license="MIT"
      />
      <div className="min-h-screen">test</div>
    </div>
  );
}
