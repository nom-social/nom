"use client";

import { useParams } from "next/navigation";

// TODO: Add a 404 component in case the repo is not found
// TODO: Implement the repo page
export default function RepoPage() {
  const params = useParams();
  const { org, repo } = params as { org: string; repo: string };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Repo Page</h1>
        <p className="text-xl">
          Org: <span className="font-mono">{org}</span>
        </p>
        <p className="text-xl">
          Repo: <span className="font-mono">{repo}</span>
        </p>
      </div>
    </div>
  );
}
