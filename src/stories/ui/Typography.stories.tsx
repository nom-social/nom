import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";

// Define a component to hold all typography examples
const Typography = {
  H1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
      {children}
    </h1>
  ),
  H2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  H3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      {children}
    </h3>
  ),
  H4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h4>
  ),
  P: ({ children }: { children: React.ReactNode }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
  ),
  Lead: ({ children }: { children: React.ReactNode }) => (
    <p className="text-muted-foreground text-xl">{children}</p>
  ),
  Large: ({ children }: { children: React.ReactNode }) => (
    <div className="text-lg font-semibold">{children}</div>
  ),
  Small: ({ children }: { children: React.ReactNode }) => (
    <small className="text-sm leading-none font-medium">{children}</small>
  ),
  Muted: ({ children }: { children: React.ReactNode }) => (
    <p className="text-muted-foreground text-sm">{children}</p>
  ),

  List: () => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </ul>
  ),
  InlineCode: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {children}
    </code>
  ),
  Table: () => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full">
        <thead>
          <tr className="even:bg-muted m-0 border-t p-0">
            <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
              Header 1
            </th>
            <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
              Header 2
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="even:bg-muted m-0 border-t p-0">
            <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
              Cell 1
            </td>
            <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
              Cell 2
            </td>
          </tr>
          <tr className="even:bg-muted m-0 border-t p-0">
            <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
              Cell 3
            </td>
            <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
              Cell 4
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  ColoredText: ({
    color,
    children,
  }: {
    color: string;
    children: React.ReactNode;
  }) => <span style={{ color }}>{children}</span>,
};

const meta = {
  title: "UI/Typography",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof Typography>;

export const Heading1: Story = {
  render: () => (
    <Typography.H1>The Quick Brown Fox Jumps Over The Lazy Dog</Typography.H1>
  ),
};

export const Heading2: Story = {
  render: () => (
    <Typography.H2>The Quick Brown Fox Jumps Over The Lazy Dog</Typography.H2>
  ),
};

export const Heading3: Story = {
  render: () => (
    <Typography.H3>The Quick Brown Fox Jumps Over The Lazy Dog</Typography.H3>
  ),
};

export const Heading4: Story = {
  render: () => (
    <Typography.H4>The Quick Brown Fox Jumps Over The Lazy Dog</Typography.H4>
  ),
};

export const Paragraph: Story = {
  render: () => (
    <Typography.P>
      The king, seeing how much happier his subjects were, realized the error of
      his ways and repealed the joke tax. Jokester was declared a hero, and the
      kingdom lived happily ever after.
    </Typography.P>
  ),
};

export const LeadParagraph: Story = {
  render: () => (
    <Typography.Lead>
      A modal dialog that interrupts the user with important content and expects
      a response.
    </Typography.Lead>
  ),
};

export const LargeText: Story = {
  render: () => <Typography.Large>Are you absolutely sure?</Typography.Large>,
};

export const SmallText: Story = {
  render: () => <Typography.Small>Email address</Typography.Small>,
};

export const MutedText: Story = {
  render: () => <Typography.Muted>Enter your email address.</Typography.Muted>,
};

export const UnorderedList: Story = {
  render: () => <Typography.List />,
};

export const InlineCode: Story = {
  render: () => (
    <Typography.InlineCode>@radix-ui/react-alert-dialog</Typography.InlineCode>
  ),
};

export const TableExample: Story = {
  render: () => <Typography.Table />,
};

export const ColoredTextExamples: Story = {
  render: () => {
    const colors = [
      { hex: "#60EC93", label: "Green" },
      { hex: "#77EBFF", label: "Blue" },
      { hex: "#FFE16A", label: "Yellow" },
      { hex: "#EF4444", label: "Destructive" },
    ];

    return (
      <div className="space-y-4">
        <Typography.H3>Colored Text Examples</Typography.H3>
        <div className="flex flex-col gap-2">
          {colors.map(({ hex, label }) => (
            <Typography.Large key={hex}>
              <Typography.ColoredText color={hex}>
                This is {label} colored text
              </Typography.ColoredText>
            </Typography.Large>
          ))}
        </div>
        <Typography.P>
          You can use{" "}
          <Typography.ColoredText color="#60EC93">
            colored text
          </Typography.ColoredText>{" "}
          within{" "}
          <Typography.ColoredText color="#77EBFF">
            regular paragraphs
          </Typography.ColoredText>{" "}
          to add{" "}
          <Typography.ColoredText color="#FFE16A">
            visual emphasis
          </Typography.ColoredText>{" "}
          or show{" "}
          <Typography.ColoredText color="#EF4444">
            destructive actions
          </Typography.ColoredText>
          .
        </Typography.P>
      </div>
    );
  },
};

// Example showing all typography elements together
export const AllTypography: Story = {
  render: () => {
    const colors = [
      { hex: "#60EC93", label: "Green" },
      { hex: "#77EBFF", label: "Blue" },
      { hex: "#FFE16A", label: "Yellow" },
      { hex: "#EF4444", label: "Destructive" },
    ];

    return (
      <div className="space-y-8">
        <Typography.H1>Typography Example</Typography.H1>
        <Typography.Lead>
          This is a comprehensive example showing all typography elements
          available in the design system.
        </Typography.Lead>
        <Typography.H2>Different Text Styles</Typography.H2>
        <Typography.P>
          Here&apos;s a regular paragraph with some text. You can use it for the
          main body content of your application. It has good readability and
          proper spacing.
        </Typography.P>
        <Typography.H3>Interactive Elements</Typography.H3>
        <Typography.List />
        <Typography.H4>Technical Information</Typography.H4>
        <Typography.P>
          When working with code, you might want to highlight package names like{" "}
          <Typography.InlineCode>@radix-ui/react-dialog</Typography.InlineCode>{" "}
          or other technical terms.
        </Typography.P>
        <Typography.Table />
        <Typography.H3>Colored Text Variations</Typography.H3>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            {colors.map(({ hex, label }) => (
              <Typography.Large key={hex}>
                <Typography.ColoredText color={hex}>
                  This is {label} colored text
                </Typography.ColoredText>
              </Typography.Large>
            ))}
          </div>
          <Typography.P>
            Colored text can be used{" "}
            <Typography.ColoredText color="#60EC93">
              inline with regular text
            </Typography.ColoredText>{" "}
            to create{" "}
            <Typography.ColoredText color="#77EBFF">
              visual hierarchy
            </Typography.ColoredText>{" "}
            and{" "}
            <Typography.ColoredText color="#FFE16A">
              emphasis
            </Typography.ColoredText>{" "}
            or indicate{" "}
            <Typography.ColoredText color="#EF4444">
              destructive actions
            </Typography.ColoredText>
            .
          </Typography.P>
        </div>
        <Typography.Muted>
          Use muted text for less important information or helper text.
        </Typography.Muted>
      </div>
    );
  },
};
