"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

import LoginForm from "./login-form";

function LoginPageContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const handleGithubLogin = async () => {
    const redirectTo =
      next && next.startsWith("/")
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo },
    });
  };

  return (
    <main className="flex items-center justify-center h-[80vh] px-2">
      <div className="max-w-2xl w-full">
        <LoginForm onLogin={handleGithubLogin} />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex items-center justify-center h-[80vh] px-2" />
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
