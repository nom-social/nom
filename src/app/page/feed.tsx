"use client";

import React from "react";
import { User } from "@supabase/supabase-js";
import { Search, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import FeedPrivate from "./feed/feed-private";
import FeedPublic from "./feed/feed-public";

const SEARCH_DEBOUNCE_MS = 300;

export default function Feed({ user }: { user: User | null }) {
  const { register, setValue, watch } = useForm<{
    search: string;
  }>({
    defaultValues: { search: "" },
  });
  const searchValue = watch("search");
  const activeQuery = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);

  const handleClear = () => {
    setValue("search", "");
  };

  if (!user) {
    return <FeedPublic searchQuery={activeQuery} />;
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <div className="flex justify-between items-center mb-4 gap-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search activities..."
            className="pl-10 pr-10 w-full"
            {...register("search")}
          />
          {searchValue && (
            <Button
              type="button"
              onClick={handleClear}
              size="icon"
              variant="ghost"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground focus:outline-none"
              tabIndex={-1}
            >
              <X />
            </Button>
          )}
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
