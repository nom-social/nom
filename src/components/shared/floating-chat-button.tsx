"use client";

import React, { useState, useEffect } from "react";
import { Send, Wand, X } from "lucide-react";
import { useChat } from "ai/react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// TODO: Fix the AI assistant here
interface ChatContext {
  feedType: "personal" | "public" | "repo";
  org?: string;
  repo?: string;
}

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<ChatContext>({ feedType: "personal" });
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Detect current context based on pathname
  useEffect(() => {
    if (pathname.includes("/page/feed")) {
      setContext({ feedType: "personal" });
    } else if (pathname.includes("/public")) {
      setContext({ feedType: "public" });
    } else if (pathname.match(/^\/[^/]+\/[^/]+/)) {
      // Repository page pattern: /org/repo
      const pathParts = pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        setContext({
          feedType: "repo",
          org: pathParts[0],
          repo: pathParts[1],
        });
      }
    } else {
      setContext({ feedType: "personal" });
    }
  }, [pathname]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      body: {
        context,
      },
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your AI assistant for the GitHub activity feed. I can help you search and query your ${
            context.feedType === "personal"
              ? "personal feed"
              : context.feedType === "public"
                ? "public feed"
                : `repository feed for ${context.org}/${context.repo}`
          }.

You can ask me to:
- Search for specific activities (e.g., "show me recent PRs")
- Filter by organization, repository, type, or date
- Use special filters like \`org:microsoft type:pr\` or \`from:2024-01-01\`
- Explain feed items and activity

What would you like to know?`,
        },
      ],
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
          <p className="text-xs text-muted-foreground">
            {context.feedType === "personal"
              ? "Personal Feed"
              : context.feedType === "public"
                ? "Public Feed"
                : `${context.org}/${context.repo}`}
          </p>
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
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground max-w-[80%] rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            </div>
          )}
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
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            aria-label="Open chat assistant"
            className={cn(
              "fixed bottom-6 right-6 z-50 border",
              "shadow-lg p-3 hover:bg-background/90",
              "active:scale-95 border-nom-blue bg-background text-white",
              "transition-all duration-300 flex items-center justify-center hover:scale-105",
              "h-14 w-14"
            )}
            size="icon"
          >
            <Wand className="w-8 h-8" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>AI Assistant</DrawerTitle>
          </DrawerHeader>
          {renderChatContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Open chat assistant"
          className={cn(
            "fixed bottom-6 right-6 z-50 border",
            "shadow-lg p-3 hover:bg-background/90",
            "active:scale-95 border-nom-blue bg-background text-white",
            "transition-all duration-300 flex items-center justify-center hover:scale-105",
            "h-14 w-14"
          )}
          size="icon"
        >
          <Wand className="w-8 h-8" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-screen max-w-sm sm:w-[400px] h-[500px] p-0"
        align="end"
        side="top"
      >
        {renderChatContent()}
      </PopoverContent>
    </Popover>
  );
}
