import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Whether the dialog is open by default",
    },
    modal: {
      control: "boolean",
      description: "Whether the dialog is modal",
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Example Dialog</DialogTitle>
          <DialogDescription>
            This is a basic dialog example with a title and description.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          Some content can go here. This is the main body of the dialog.
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog (No Close Button)</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No Close Button</DialogTitle>
          <DialogDescription>
            This dialog doesn&apos;t show the close button in the top-right
            corner.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Long Dialog</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scrollable Content</DialogTitle>
          <DialogDescription>
            This dialog contains long content that will scroll.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <p key={i} className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          ))}
        </div>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          <h3 className="text-lg font-semibold">Dialog Variations</h3>
          <div className="flex gap-4">
            {/* Basic Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>Basic Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Basic Dialog</DialogTitle>
                  <DialogDescription>
                    A simple dialog example.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">Some content here.</div>
                <DialogFooter>
                  <Button>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog without close button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">No Close Button</Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>No Close Button</DialogTitle>
                </DialogHeader>
                <DialogFooter>
                  <Button>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog with form */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">With Form</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <form className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border p-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full rounded-md border p-2"
                      />
                    </div>
                  </form>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Dialog Sizes</h3>
          <div className="flex gap-4">
            {/* Small Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>Small Dialog</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Small Dialog</DialogTitle>
                </DialogHeader>
                <div className="py-4">Compact content.</div>
                <DialogFooter>
                  <Button>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Large Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>Large Dialog</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Large Dialog</DialogTitle>
                </DialogHeader>
                <div className="py-4">More spacious content area.</div>
                <DialogFooter>
                  <Button>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  },
};
