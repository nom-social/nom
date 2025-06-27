import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <div>
      <Toaster />
      <Button onClick={() => toast("This is a toast!")}>Show Toast</Button>
    </div>
  ),
};

export const KitchenSink: Story = {
  parameters: {
    controls: { disable: true },
    previewTabs: {
      "storybook/docs/panel": { hidden: true },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4 items-center p-4">
      <Toaster />
      <div className="flex gap-2">
        <Button onClick={() => toast("Default toast")}>Default</Button>
        <Button onClick={() => toast.success("Success toast")}>Success</Button>
        <Button onClick={() => toast.error("Error toast")}>Error</Button>
        <Button onClick={() => toast.loading("Loading toast")}>Loading</Button>
        <Button
          onClick={() =>
            toast("Custom toast", {
              description: "With a description and custom action.",
              action: {
                label: "Undo",
                onClick: () => alert("Undo clicked!"),
              },
            })
          }
        >
          Custom
        </Button>
      </div>
    </div>
  ),
};
