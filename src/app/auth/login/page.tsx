"use client";

import { createClient } from "@/utils/supabase/client";

import LoginForm from "./login-form";

export default function LoginPage() {
  const supabase = createClient();

  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
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
