import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Star } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
    children: {
      control: "text",
    },
    asChild: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Destructive: Story = {
  args: {
    children: "Destructive",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const WithIcon: Story = {
  render: () => (
    <Badge>
      <Star />
      New Feature
    </Badge>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Badge asChild>
      <Link href="/">Badge</Link>
    </Badge>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Badge className="bg-[#60EC93] text-black hover:bg-[#60EC93]/90 border-transparent">
        Green
      </Badge>
      <Badge className="bg-[#77EBFF] text-black hover:bg-[#77EBFF]/90 border-transparent">
        Blue
      </Badge>
      <Badge className="bg-[#FFE16A] text-black hover:bg-[#FFE16A]/90 border-transparent">
        Yellow
      </Badge>
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
  render: () => {
    const variants = [
      "default",
      "secondary",
      "destructive",
      "outline",
    ] as const;

    const customColors = [
      { bg: "#60EC93", label: "Green" },
      { bg: "#77EBFF", label: "Blue" },
      { bg: "#FFE16A", label: "Yellow" },
    ];

    return (
      <div className="flex flex-col gap-8 p-4">
        {/* Regular Badges - All variants */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">All Variants</h3>
          <div className="flex gap-4">
            {variants.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Custom Colors</h3>
          <div className="flex gap-4">
            {customColors.map(({ bg, label }) => (
              <Badge
                key={bg}
                style={{
                  backgroundColor: bg,
                  color: "black",
                }}
                className="border-transparent hover:opacity-90"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* With Icons */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">With Icons</h3>
          <div className="flex gap-4">
            {variants.map((variant) => (
              <Badge key={variant} variant={variant}>
                <Star />
                With Icon
              </Badge>
            ))}
          </div>
        </div>

        {/* As Links */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">As Links</h3>
          <div className="flex gap-4">
            {variants.map((variant) => (
              <Badge key={variant} variant={variant} asChild>
                <Link href="/">Click me</Link>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
