import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/supabase";

export async function getCurrentUser(): Promise<Tables<"users"> | null> {
  const supabase = createClient(cookies());
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const userId = session.user.id;
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return user ?? null;
}

getCurrentUser.key = "src/app/layout/profile-dropdown/actions/getCurrentUser";
