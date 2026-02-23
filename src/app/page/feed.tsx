"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Search, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBackUrl } from "@/hooks/use-back-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { useSyncParamToUrl } from "@/hooks/use-sync-param-to-url";

import FeedPublic from "./feed/feed-public";

const SEARCH_DEBOUNCE_MS = 300;

export default function Feed({ user }: { user: User | null }) {
  useScrollRestore();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";

  const { register, setValue, watch } = useForm<{
    search: string;
  }>({
    defaultValues: { search: qFromUrl },
  });
  const searchValue = watch("search");
  const activeQuery = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);
  useSyncParamToUrl("q", activeQuery);
  const backUrl = useBackUrl();

  const handleClear = () => {
    setValue("search", "");
  };

  if (!user) {
    return <FeedPublic searchQuery={activeQuery} back={backUrl} />;
  }

  return (
    <Tabs value="general" className="w-full">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nom-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-nom-green" />
            </span>
            <span>Live activities</span>
          </div>
          <TabsList>
            <TabsTrigger value="general" asChild>
              <Link href="/">General</Link>
            </TabsTrigger>
            <TabsTrigger value="following" asChild>
              <Link href="/following">Following</Link>
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="relative w-full">
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
      <FeedPublic searchQuery={activeQuery} back={backUrl} />
    </Tabs>
  );
}
