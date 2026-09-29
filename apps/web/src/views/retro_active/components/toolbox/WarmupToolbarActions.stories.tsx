import type { Meta, StoryObj } from "@storybook/react-vite";
import { WarmupToolbarActions } from "./WarmupToolbarActions";

const meta = {
  title: "retro/toolbar/WarmupToolbarActions",
  component: WarmupToolbarActions,
  args: {
    action: "start",
    enabled: true,
    onClick: () => {},
  },
  decorators: [
    (Story) => (
      <div className="grid h-16 w-48 grid-cols-2 gap-2 rounded-t-2xl border bg-card p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WarmupToolbarActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StartDraw: Story = {};

export const OpenLink: Story = {
  args: { action: "open", enabled: true },
};

export const OpenLinkDisabled: Story = {
  args: { action: "open", enabled: false },
};
