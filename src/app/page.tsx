import { createClient } from "@/utils/supabase/client";

import Feed from "./page/feed";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="px-2">
      <Feed session={session} />
    </div>
  );
}
