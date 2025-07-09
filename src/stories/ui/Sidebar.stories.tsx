import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Home,
  Settings,
  Search,
  User,
  FileText,
  Calendar,
  Mail,
  Bell,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const meta = {
  title: "UI/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "select",
      options: ["left", "right"],
      description: "Which side of the screen the sidebar appears on",
    },
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
      description: "Visual style variant of the sidebar",
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
      description: "How the sidebar behaves when collapsed",
    },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarInput placeholder="Search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Home />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Search />
                      <span>Search</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center border-b px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">Main Content</h1>
          </header>
          <main className="flex-1 p-4">
            <p>This is the main content area.</p>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

export const Floating: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar variant="floating">
          <SidebarHeader>
            <SidebarInput placeholder="Search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Home />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Search />
                      <span>Search</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center border-b px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">Floating Sidebar</h1>
          </header>
          <main className="flex-1 p-4">
            <p>
              This sidebar has a floating appearance with rounded corners and
              shadow.
            </p>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

export const Inset: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar variant="inset">
          <SidebarHeader>
            <SidebarInput placeholder="Search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Home />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Search />
                      <span>Search</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center border-b px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">Inset Sidebar</h1>
          </header>
          <main className="flex-1 p-4">
            <p>
              This sidebar has an inset appearance with margin around the
              content.
            </p>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

export const RightSide: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <SidebarInset>
          <header className="flex h-16 items-center justify-between border-b px-4">
            <h1 className="text-lg font-semibold">Right Sidebar</h1>
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-4">
            <p>The sidebar appears on the right side of the screen.</p>
          </main>
        </SidebarInset>
        <Sidebar side="right">
          <SidebarHeader>
            <SidebarInput placeholder="Search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Home />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Search />
                      <span>Search</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  ),
};

export const WithMenuActions: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarInput placeholder="Search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupAction>
                <MoreHorizontal />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <FileText />
                      <span>Design System</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction>
                      <MoreHorizontal />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Calendar />
                      <span>Calendar App</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center border-b px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">Menu Actions</h1>
          </header>
          <main className="flex-1 p-4">
            <p>This sidebar includes menu actions and group actions.</p>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarInput placeholder="Search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Mail />
                      <span>Inbox</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>12</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Bell />
                      <span>Notifications</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>3</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center border-b px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">With Badges</h1>
          </header>
          <main className="flex-1 p-4">
            <p>This sidebar shows badges for notification counts.</p>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

export const WithSubmenus: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarInput placeholder="Search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Home />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings />
                      <span>Settings</span>
                      <ChevronRight className="ml-auto" />
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>General</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>Security</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>Notifications</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center border-b px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">With Submenus</h1>
          </header>
          <main className="flex-1 p-4">
            <p>This sidebar includes nested submenus.</p>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

export const WithSkeleton: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarInput placeholder="Search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Loading...</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center border-b px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">Loading States</h1>
          </header>
          <main className="flex-1 p-4">
            <p>This sidebar shows skeleton loading states.</p>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
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
          <h3 className="text-lg font-semibold">Sidebar Variants</h3>
          <div className="grid grid-cols-1 gap-8">
            {/* Default Sidebar */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-2 bg-muted text-sm font-medium">Default</div>
              <div className="h-96">
                <SidebarProvider>
                  <div className="flex h-full w-full">
                    <Sidebar>
                      <SidebarHeader>
                        <SidebarInput placeholder="Search..." />
                      </SidebarHeader>
                      <SidebarContent>
                        <SidebarGroup>
                          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              <SidebarMenuItem>
                                <SidebarMenuButton>
                                  <Home />
                                  <span>Home</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <SidebarMenuButton>
                                  <Search />
                                  <span>Search</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                      </SidebarContent>
                    </Sidebar>
                    <SidebarInset>
                      <header className="flex h-16 items-center border-b px-4">
                        <SidebarTrigger />
                        <h1 className="ml-4 text-lg font-semibold">Default</h1>
                      </header>
                      <main className="flex-1 p-4">
                        <p>Standard sidebar layout</p>
                      </main>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </div>
            </div>

            {/* Floating Sidebar */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-2 bg-muted text-sm font-medium">Floating</div>
              <div className="h-96">
                <SidebarProvider>
                  <div className="flex h-full w-full">
                    <Sidebar variant="floating">
                      <SidebarHeader>
                        <SidebarInput placeholder="Search..." />
                      </SidebarHeader>
                      <SidebarContent>
                        <SidebarGroup>
                          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              <SidebarMenuItem>
                                <SidebarMenuButton>
                                  <Home />
                                  <span>Home</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <SidebarMenuButton>
                                  <Search />
                                  <span>Search</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                      </SidebarContent>
                    </Sidebar>
                    <SidebarInset>
                      <header className="flex h-16 items-center border-b px-4">
                        <SidebarTrigger />
                        <h1 className="ml-4 text-lg font-semibold">Floating</h1>
                      </header>
                      <main className="flex-1 p-4">
                        <p>Floating sidebar with shadow</p>
                      </main>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </div>
            </div>

            {/* Complex Sidebar */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-2 bg-muted text-sm font-medium">
                Full Featured
              </div>
              <div className="h-96">
                <SidebarProvider>
                  <div className="flex h-full w-full">
                    <Sidebar>
                      <SidebarHeader>
                        <SidebarInput placeholder="Search..." />
                      </SidebarHeader>
                      <SidebarContent>
                        <SidebarGroup>
                          <SidebarGroupLabel>Main</SidebarGroupLabel>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              <SidebarMenuItem>
                                <SidebarMenuButton>
                                  <Home />
                                  <span>Home</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <SidebarMenuButton>
                                  <Mail />
                                  <span>Inbox</span>
                                </SidebarMenuButton>
                                <SidebarMenuBadge>12</SidebarMenuBadge>
                              </SidebarMenuItem>
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                        <SidebarSeparator />
                        <SidebarGroup>
                          <SidebarGroupLabel>Projects</SidebarGroupLabel>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              <SidebarMenuItem>
                                <SidebarMenuButton>
                                  <FileText />
                                  <span>Design System</span>
                                </SidebarMenuButton>
                                <SidebarMenuAction>
                                  <MoreHorizontal />
                                </SidebarMenuAction>
                              </SidebarMenuItem>
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                      </SidebarContent>
                      <SidebarFooter>
                        <SidebarMenu>
                          <SidebarMenuItem>
                            <SidebarMenuButton>
                              <User />
                              <span>Profile</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      </SidebarFooter>
                    </Sidebar>
                    <SidebarInset>
                      <header className="flex h-16 items-center border-b px-4">
                        <SidebarTrigger />
                        <h1 className="ml-4 text-lg font-semibold">
                          Full Featured
                        </h1>
                      </header>
                      <main className="flex-1 p-4">
                        <p>Complete sidebar with all features</p>
                      </main>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
