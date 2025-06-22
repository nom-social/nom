import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Additional information</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Long tooltip</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          This is a longer tooltip with more detailed information that wraps to
          multiple lines
        </p>
      </TooltipContent>
    </Tooltip>
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
        {/* Basic tooltip */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium">Basic</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Basic tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Icon tooltip */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium">With Icon</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Icon tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Long content tooltip */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium">Long Content</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Long tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This tooltip contains more detailed information</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Custom styled tooltip */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium">Custom Style</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Custom style</Button>
            </TooltipTrigger>
            <TooltipContent className="bg-secondary">
              <p>Custom styled tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};
