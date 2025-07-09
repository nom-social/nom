import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p>This is a popover</p>
      </PopoverContent>
    </Popover>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <p>More info in this popover</p>
      </PopoverContent>
    </Popover>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Long popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p>
          This is a longer popover with more detailed information that wraps to
          multiple lines. You can put any content here, including <b>bold</b>,
          <i>italic</i>, or even custom components.
        </p>
      </PopoverContent>
    </Popover>
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
    <div className="flex flex-col items-center gap-8 p-4">
      <div className="grid grid-cols-2 gap-8">
        {/* Basic popover */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium">Basic</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open</Button>
            </PopoverTrigger>
            <PopoverContent>
              <p>Basic popover</p>
            </PopoverContent>
          </Popover>
        </div>

        {/* Icon popover */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium">With Icon</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <p>Icon popover</p>
            </PopoverContent>
          </Popover>
        </div>

        {/* Long content popover */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium">Long Content</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Long popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <p>
                This popover contains more detailed information and can be used
                for forms, lists, or any custom content.
              </p>
            </PopoverContent>
          </Popover>
        </div>

        {/* Custom styled popover */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium">Custom Style</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Custom style</Button>
            </PopoverTrigger>
            <PopoverContent className="bg-secondary">
              <p>Custom styled popover</p>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  ),
};
