import type { Metadata } from "next";
import Script from "next/script";
import { GeistPixelSquare } from "geist/font/pixel";
import { Jersey_15 } from "next/font/google";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Toaster } from "@/components/ui/sonner";

import { BASE_URL } from "@/lib/constants";

import "./globals.css";
import ProfileDropdown from "./layout/profile-dropdown";
import ReactQueryProvider from "./layout/react-query-provider";
import { ThemeProvider } from "./layout/theme-provider";

const jersey15 = Jersey_15({
  variable: "--font-jersey-15",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Nom",
  description:
    "Live commentary for your codebase. A social feed for your project's GitHub activities — pull requests, releases, and pushes with AI summaries.",
  openGraph: {
    title: "Nom — Live commentary for your codebase",
    description:
      "A social feed for your project's GitHub activities. Follow pull requests, releases, and pushes with AI summaries.",
    url: BASE_URL,
    siteName: "Nom",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nom — Live commentary for your codebase",
    description:
      "A social feed for your project's GitHub activities. Follow pull requests, releases, and pushes with AI summaries.",
    images: ["/og-image.png"],
  },
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
          <Script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            strategy="beforeInteractive"
          />
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
                        className="font-jersey-15 text-xl uppercase"
                      >
                        Nom
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <span className="hidden md:inline text-xs text-muted-foreground font-normal normal-case">
                      Live commentary for your codebase
                    </span>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <NavigationMenuItem>
                      <NavigationMenuLink
                        href="https://tally.so/r/81KVZA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        hiring?
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <ProfileDropdown />
                  </div>
                </NavigationMenuList>
              </div>
            </NavigationMenu>
            <div className="max-w-3xl mx-auto py-18">{children}</div>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
