import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Notification</CardTitle>
        <CardDescription>You have a new message</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Mark as Read
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>John Doe sent you a message regarding the project deadline.</p>
      </CardContent>
      <CardFooter className="gap-2 w-full">
        <Button variant="outline" size="sm">
          Dismiss
        </Button>
        <Button size="sm">View</Button>
      </CardFooter>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent>
        <p>A simple card with only content.</p>
      </CardContent>
    </Card>
  ),
};

export const HeaderAndContent: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Continue where you left off</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Your last session was 2 hours ago.</p>
      </CardContent>
    </Card>
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
    <div className="flex flex-col gap-8 p-4">
      {/* Basic Layout Variations */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Header Only</CardTitle>
            <CardDescription>A card with just a header</CardDescription>
          </CardHeader>
        </Card>

        <Card className="w-[350px]">
          <CardContent>
            <p>Content Only</p>
            <p className="text-muted-foreground text-sm">No header or footer</p>
          </CardContent>
        </Card>

        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Header & Content</CardTitle>
            <CardDescription>Most common layout</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Some content here</p>
          </CardContent>
        </Card>

        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>With all sections</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content area</p>
          </CardContent>
          <CardFooter>
            <p>Footer content</p>
          </CardFooter>
        </Card>
      </div>

      {/* Interactive Examples */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>With Action</CardTitle>
            <CardDescription>Card with action button</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm">
                Action
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>Content with header action</p>
          </CardContent>
        </Card>

        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Interactive Footer</CardTitle>
            <CardDescription>Common dialog-style layout</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content with interactive footer</p>
          </CardContent>
          <CardFooter className="gap-2 w-full">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Continue</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  ),
};
