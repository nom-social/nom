import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { z } from "zod";
import { fetchPublicFeed } from "@/app/page/feed/actions";
import { Markdown } from "@/components/ui/markdown";

const queryFeedSchema = z.object({
  args: z.object({
    query: z.string(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export default function AIAside() {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
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

  return (
    <Sidebar side="right" className="z-51">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <span>AI Assistant</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
            onClick={() => (isMobile ? setOpenMobile(false) : setOpen(false))}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col h-full max-h-full">
          <ScrollArea className="flex-1 min-h-0 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm " +
                      (message.role === "user"
                        ? "bg-nom-blue text-black"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    {message.role === "user" ? (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    ) : (
                      <Markdown>{message.content}</Markdown>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t shrink-0">
            {/* TODO: On submitting, we should scroll to the bottom of the chat */}
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
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
