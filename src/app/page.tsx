import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

import Feed from "./page/feed";

export default async function Home() {
  const supabase = createClient(cookies());
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="px-2">
      <Feed session={session} />
    </div>
  );
}
