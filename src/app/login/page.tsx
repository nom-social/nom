"use client";

import { Github } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const supabase = createClient();

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="space-y-6">
          <Button onClick={handleGithubLogin} className="w-full cursor-pointer">
            <Github className="w-5 h-5 mr-2" />
            Continue with GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
