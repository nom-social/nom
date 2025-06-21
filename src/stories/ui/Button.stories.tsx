import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    children: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    asChild: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
};

export const Destructive: Story = {
  args: {
    children: "Delete",
    variant: "destructive",
    size: "default",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
    size: "default",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
    size: "default",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost",
    variant: "ghost",
    size: "default",
  },
};

export const Link: Story = {
  args: {
    children: "Link",
    variant: "link",
    size: "default",
  },
};

export const Small: Story = {
  args: {
    children: "Small",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "Large",
    size: "lg",
  },
};

export const Icon: Story = {
  render: () => (
    <Button size="icon">
      <Search className="h-4 w-4" />
    </Button>
  ),
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

export const KitchenSink: Story = {
  parameters: {
    controls: { disable: true }, // Disable controls for this story
    previewTabs: {
      "storybook/docs/panel": { hidden: true }, // Optional: Hide the docs panel as well since it's a display-only story
    },
  },
  render: () => {
    const variants = [
      "default",
      "destructive",
      "outline",
      "secondary",
      "ghost",
      "link",
    ] as const;
    const sizes = ["sm", "default", "lg"] as const;

    return (
      <div className="flex flex-col gap-8 p-4">
        {/* Regular Buttons - All variants and sizes */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">All Variants & Sizes</h3>
          <div className="grid grid-cols-6 gap-4">
            {variants.map((variant) => (
              <div key={variant} className="flex flex-col gap-4">
                <div className="text-sm font-medium capitalize">{variant}</div>
                {sizes.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    {size === "sm"
                      ? "Small"
                      : size === "lg"
                      ? "Large"
                      : "Default"}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Icon Buttons */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Icon Buttons</h3>
          <div className="flex gap-4">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>

        {/* Disabled State */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Disabled State</h3>
          <div className="flex gap-4">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} disabled>
                Disabled
              </Button>
            ))}
          </div>
        </div>

        {/* With Icons */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">With Icons</h3>
          <div className="flex gap-4">
            {variants.map((variant) => (
              <Button key={variant} variant={variant}>
                <Search className="h-4 w-4" />
                With Icon
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
