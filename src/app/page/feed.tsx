"use client";

import { User } from "@supabase/supabase-js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import FeedPrivate from "./feed/feed-private";
import FeedPublic from "./feed/feed-public";

export default function Feed({ user }: { user: User | null }) {
  if (!user) {
    return <FeedPublic />;
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <FeedPublic />
      </TabsContent>
      <TabsContent value="following">
        <FeedPrivate />
      </TabsContent>
    </Tabs>
  );
}
