import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { JetBrains_Mono } from "next/font/google";

import "../src/app/globals.css";
import { ThemeProvider } from "../src/components/theme-provider";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div className={`dark ${jetbrainsMono.variable} font-mono antialiased`}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
