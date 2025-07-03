import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/supabase";

export async function getCurrentUser(): Promise<Tables<"users"> | null> {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const userId = user.id;
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return userData ?? null;
}

getCurrentUser.key = "src/app/layout/profile-dropdown/actions/getCurrentUser";
