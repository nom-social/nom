"use client";

import React, { useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { fetchPublicFeed } from "@/app/page/feed/actions";
import { Markdown } from "@/components/ui/markdown";

const queryFeedSchema = z.object({
  args: z.object({
    query: z.string(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    maxSteps: 5,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === "queryFeed") {
        const { args } = queryFeedSchema.parse(toolCall);
        const result = await fetchPublicFeed(args);

        return result.items.map((item) => ({
          text: item.search_text,
          type: item.type,
          updated_at: item.updated_at,
          url:
            `${window.location.origin}/${item.repositories.org}/` +
            `${item.repositories.repo}/status/${item.dedupe_hash}`,
        }));
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSubmit(e);
  };

  const renderChatContent = () => (
    <div className="flex flex-col h-full max-h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex flex-col">
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-nom-blue text-black"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {message.role === "user" ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <Markdown>{message.content}</Markdown>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t shrink-0">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your feed..."
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0"
            disabled={!input.trim()}
          >
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <Drawer
      open={isOpen}
      onOpenChange={setIsOpen}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerTrigger asChild>
        <Button
          aria-label="Open chat assistant"
          className={cn(
            "fixed bottom-6 right-6 z-50 border",
            "shadow-lg p-3 hover:bg-background/90",
            "border-nom-blue bg-background text-white",
            "flex items-center justify-center",
            "h-14 w-14"
          )}
          size="icon"
        >
          <Sparkles className="w-8 h-8" />
        </Button>
      </DrawerTrigger>
      <DrawerContent
        className={cn(
          isMobile ? "h-[80vh]" : "h-full max-h-screen",
          isMobile ? "w-full" : "!w-[40vw] !max-w-none"
        )}
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>AI Assistant</DrawerTitle>
        </DrawerHeader>
        {renderChatContent()}
      </DrawerContent>
    </Drawer>
  );
}
