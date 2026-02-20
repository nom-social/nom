import type { Metadata } from "next";
import { GeistPixelSquare } from "geist/font/pixel";
import { Jersey_15 } from "next/font/google";

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

const jersey15 = Jersey_15({
  variable: "--font-jersey-15",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Nom",
  description: "Update your users in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistPixelSquare.variable} ${jersey15.variable} font-sans antialiased min-h-screen overflow-y-scroll`}
      >
        {process.env.NODE_ENV === "development" && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" />
        )}
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ReactQueryProvider>
            <Toaster />
            <NavigationMenu className="w-full min-w-full bg-background fixed top-0 left-0 z-60 border-b border-border shadow-sm p-2">
              <div className="max-w-3xl mx-auto w-full">
                <NavigationMenuList className="justify-between items-center">
                  <div className="flex flex-row gap-2 items-center">
                    <NavigationMenuItem>
                      <NavigationMenuLink
                        href="/"
                        className="font-jersey-15 text-lg uppercase"
                      >
                        Nom
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <span className="text-xs text-muted-foreground font-normal normal-case">
                      Update your users in real-time
                    </span>
                  </div>

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
