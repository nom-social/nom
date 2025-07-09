"use client";

import React, { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Search } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import FeedPrivate from "./feed/feed-private";
import FeedPublic from "./feed/feed-public";

export default function Feed({ user }: { user: User | null }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  if (!user) {
    return <FeedPublic searchQuery={activeQuery} />;
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {/* TODO: Make this less laggy when typing, maybe use react hook forms */}
          {/* TODO: Also add a clear button */}
          <Input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 w-64"
          />
        </div>
      </div>
      <TabsContent value="general">
        <FeedPublic searchQuery={activeQuery} />
      </TabsContent>
      <TabsContent value="following">
        <FeedPrivate searchQuery={activeQuery} />
      </TabsContent>
    </Tabs>
  );
}
