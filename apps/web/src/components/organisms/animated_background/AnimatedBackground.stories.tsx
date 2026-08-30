import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedBackground } from "./AnimatedBackground";

const meta = {
  title: "organisms/AnimatedBackground",
  component: AnimatedBackground,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AnimatedBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="m-12 rounded-xl bg-card p-8 shadow">Treść strony</div>
    ),
  },
};
