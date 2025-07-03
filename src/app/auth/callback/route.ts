import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import { createClient as createBackgroundClient } from "@/utils/supabase/background";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    next = "/";
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const backgroundSupabase = createBackgroundClient();

    // Exchange code for session
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Store provider token in user metadata if it exists
      if (session?.provider_token) {
        await supabase.auth.updateUser({
          data: { provider_token: session.provider_token },
        });
      }

      // Upsert user information
      if (session?.user) {
        await supabase
          .from("users")
          .upsert(
            {
              id: session.user.id,
              email: session.user.email!,
              github_username: session.user.user_metadata.user_name,
            },
            { onConflict: "id" }
          )
          .throwOnError();

        // Link user to repos where they are champion_github_username
        const { data: championedRepos } = await backgroundSupabase
          .from("repositories")
          .update({ champion_github_username: null })
          .eq("champion_github_username", session.user.user_metadata.user_name)
          .select("id")
          .throwOnError();
        await backgroundSupabase
          .from("repositories_users")
          .upsert(
            championedRepos.map((repo: { id: string }) => ({
              user_id: session.user.id,
              repo_id: repo.id,
            })),
            { onConflict: "user_id,repo_id" }
          )
          .throwOnError();
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(origin);
}
