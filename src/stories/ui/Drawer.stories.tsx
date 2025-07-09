import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const meta = {
  title: "UI/Drawer",
  component: Drawer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    direction: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Direction from which the drawer slides in",
    },
    shouldScaleBackground: {
      control: "boolean",
      description: "Whether to scale the background when drawer is open",
    },
    snapPoints: {
      control: "object",
      description: "Snap points for the drawer",
    },
    fadeFromIndex: {
      control: "number",
      description: "Index from which the fade starts",
    },
    modal: {
      control: "boolean",
      description: "Whether the drawer is modal",
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Example Drawer</DrawerTitle>
          <DrawerDescription>
            This is a basic drawer example with a title and description.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4">
          Some content can go here. This is the main body of the drawer.
        </div>
        <DrawerFooter>
          <Button>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const FromTop: Story = {
  render: () => (
    <Drawer direction="top">
      <DrawerTrigger asChild>
        <Button variant="outline">Open from Top</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Top Drawer</DrawerTitle>
          <DrawerDescription>
            This drawer slides down from the top of the screen.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4">Content for the top drawer.</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const FromLeft: Story = {
  render: () => (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button variant="outline">Open from Left</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Left Drawer</DrawerTitle>
          <DrawerDescription>
            This drawer slides in from the left side.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4">
          <p className="mb-4">
            This is a side drawer, typically used for navigation.
          </p>
          <ul className="space-y-2">
            <li>Menu Item 1</li>
            <li>Menu Item 2</li>
            <li>Menu Item 3</li>
          </ul>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const FromRight: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Open from Right</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Right Drawer</DrawerTitle>
          <DrawerDescription>
            This drawer slides in from the right side.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4">
          <p className="mb-4">Right side drawer content.</p>
          <div className="space-y-2">
            <p>Settings</p>
            <p>Profile</p>
            <p>Notifications</p>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Form Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Profile</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4">
          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="Tell us about yourself"
              />
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button type="submit">Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithScrollableContent: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Scrollable Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Scrollable Content</DrawerTitle>
          <DrawerDescription>
            This drawer contains long content that will scroll.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[60vh] px-4">
          <div className="py-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <p key={i} className="mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur.
              </p>
            ))}
          </div>
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithSnapPoints: Story = {
  render: () => (
    <Drawer snapPoints={[148, 355, 1]} fadeFromIndex={1}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open with Snap Points</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Snap Points Drawer</DrawerTitle>
          <DrawerDescription>
            This drawer has snap points and can be dragged to different heights.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4">
          <p className="mb-4">Try dragging this drawer to different heights.</p>
          <p className="mb-4">
            The drawer will snap to predefined positions based on the snap
            points.
          </p>
          <p>
            This is useful for creating drawers that can be partially opened.
          </p>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const NonModal: Story = {
  render: () => (
    <Drawer modal={false}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Non-Modal Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Non-Modal Drawer</DrawerTitle>
          <DrawerDescription>
            This drawer is non-modal, so you can interact with the background.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4">
          You can click outside this drawer and it won&apos;t close
          automatically.
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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
    return (
      <div className="flex flex-col gap-8 p-4">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Drawer Directions</h3>
          <div className="flex gap-4">
            {/* Bottom Drawer (Default) */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button>Bottom (Default)</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Bottom Drawer</DrawerTitle>
                  <DrawerDescription>
                    Default drawer from bottom
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 py-4">Bottom drawer content.</div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            {/* Top Drawer */}
            <Drawer direction="top">
              <DrawerTrigger asChild>
                <Button variant="outline">Top</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Top Drawer</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 py-4">Top drawer content.</div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            {/* Left Drawer */}
            <Drawer direction="left">
              <DrawerTrigger asChild>
                <Button variant="secondary">Left</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Left Drawer</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 py-4">Left drawer content.</div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            {/* Right Drawer */}
            <Drawer direction="right">
              <DrawerTrigger asChild>
                <Button variant="ghost">Right</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Right Drawer</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 py-4">Right drawer content.</div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Drawer Features</h3>
          <div className="flex gap-4">
            {/* With Form */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button>With Form</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Form Drawer</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 py-4">
                  <input
                    type="text"
                    className="w-full rounded border p-2"
                    placeholder="Sample input"
                  />
                </div>
                <DrawerFooter>
                  <Button>Submit</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            {/* Non-Modal */}
            <Drawer modal={false}>
              <DrawerTrigger asChild>
                <Button variant="outline">Non-Modal</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Non-Modal</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 py-4">Click outside to test.</div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            {/* With Snap Points */}
            <Drawer snapPoints={[148, 355, 1]} fadeFromIndex={1}>
              <DrawerTrigger asChild>
                <Button variant="secondary">Snap Points</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Snap Points</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 py-4">Drag to snap positions.</div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    );
  },
};
