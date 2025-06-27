import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Tab One</TabsTrigger>
        <TabsTrigger value="tab2">Tab Two</TabsTrigger>
        <TabsTrigger value="tab3">Tab Three</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content for Tab One</TabsContent>
      <TabsContent value="tab2">Content for Tab Two</TabsContent>
      <TabsContent value="tab3">Content for Tab Three</TabsContent>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Active</TabsTrigger>
        <TabsTrigger value="tab2" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="tab3">Other</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Active tab content</TabsContent>
      <TabsContent value="tab2">Should not be selectable</TabsContent>
      <TabsContent value="tab3">Other tab content</TabsContent>
    </Tabs>
  ),
};
