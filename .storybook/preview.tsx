import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { GeistPixelSquare } from "geist/font/pixel";

import "../src/app/globals.css";
import { ThemeProvider } from "../src/components/layout/theme-provider";

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
        <div className={`dark ${GeistPixelSquare.variable} font-sans antialiased`}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
