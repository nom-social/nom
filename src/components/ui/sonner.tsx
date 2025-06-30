"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
          } as React.CSSProperties
        }
        toastOptions={{
          classNames: {
            success:
              "!bg-[var(--nom-green)] !text-black !border-none !shadow-none",
            error:
              "!bg-[var(--color-destructive)] !text-white !border-none !shadow-none",
          },
        }}
        {...props}
      />
      <style>{`.toaster [data-icon] { display: none !important; }`}</style>
    </>
  );
};

export { Toaster };
