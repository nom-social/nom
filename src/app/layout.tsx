import type { Metadata } from "next";
import { JetBrains_Mono, Jersey_15 } from "next/font/google";

import ReactQueryProvider from "@/components/layout/react-query-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";
import ProfileDropdown from "./layout/profile-dropdown";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jersey15 = Jersey_15({
  variable: "--font-jersey-15",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Nom",
  description:
    "Grow your audience with every commit, Nom is your social media for code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jetbrainsMono.variable} ${jersey15.variable} font-mono antialiased min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ReactQueryProvider>
            <Toaster />
            <NavigationMenu className="w-full min-w-full bg-background fixed top-0 left-0 z-50 border-b border-border shadow-sm p-2">
              <div className="max-w-3xl mx-auto w-full">
                <NavigationMenuList className="justify-between items-center">
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/"
                      className="font-jersey-15 text-lg"
                    >
                      NOM
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <ProfileDropdown />
                </NavigationMenuList>
              </div>
            </NavigationMenu>
            <div className="max-w-3xl mx-auto pt-18">{children}</div>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
