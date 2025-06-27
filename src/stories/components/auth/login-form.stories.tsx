import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import LoginForm from "@/components/auth/login-form";

const meta = {
  title: "Components/Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onLogin: fn(),
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  render: (args) => (
    <div className="w-2xl">
      <LoginForm {...args} />
    </div>
  ),
};
