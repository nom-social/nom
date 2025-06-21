import React from "react";
import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";
import { ThemeProvider } from "../src/components/theme-provider";

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
        <div className="dark">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
