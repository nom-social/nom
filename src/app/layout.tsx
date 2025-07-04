import type { Metadata } from "next";
import { JetBrains_Mono, Jersey_15 } from "next/font/google";
import Script from "next/script";

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
        className={`${jetbrainsMono.variable} ${jersey15.variable} font-mono antialiased min-h-screen overflow-y-scroll`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ReactQueryProvider>
            <Toaster />
            <NavigationMenu className="w-full min-w-full bg-background fixed top-0 left-0 z-50 border-b border-border shadow-sm p-2">
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
        <Script id="tawkto" strategy="afterInteractive">
          {`
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/686486b6db555c190ce73967/1iv4ase3s';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
