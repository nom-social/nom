import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";

import { Input } from "@/components/ui/input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: [
        "text",
        "password",
        "email",
        "number",
        "search",
        "tel",
        "url",
        "file",
      ],
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    className: {
      control: "text",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    type: "text",
    placeholder: "Enter text...",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password...",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "Enter email...",
  },
};

export const Number: Story = {
  args: {
    type: "number",
    placeholder: "Enter number...",
  },
};

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
};

export const File: Story = {
  args: {
    type: "file",
  },
};

export const Disabled: Story = {
  args: {
    type: "text",
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    type: "text",
    placeholder: "Input with error",
    "aria-invalid": true,
  },
};

export const KitchenSink: Story = {
  parameters: {
    controls: { disable: true },
    previewTabs: {
      "storybook/docs/panel": { hidden: true },
    },
  },
  render: () => {
    const types = [
      "text",
      "password",
      "email",
      "number",
      "search",
      "tel",
      "url",
      "file",
    ] as const;

    return (
      <div className="flex flex-col gap-8 p-4">
        {/* Regular Inputs - All types */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">All Input Types</h3>
          <div className="grid grid-cols-2 gap-4">
            {types.map((type) => (
              <div key={type} className="flex flex-col gap-2">
                <div className="text-sm font-medium capitalize">{type}</div>
                <Input type={type} placeholder={`Enter ${type}...`} />
              </div>
            ))}
          </div>
        </div>

        {/* States */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Input States</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Default</div>
              <Input placeholder="Default input" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Disabled</div>
              <Input placeholder="Disabled input" disabled />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">With Error</div>
              <Input placeholder="Input with error" aria-invalid={true} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">With Value</div>
              <Input defaultValue="Pre-filled value" />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
