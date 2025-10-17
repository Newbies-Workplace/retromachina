import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "@/components/atoms/avatar/Avatar";

const meta = {
  title: "atoms/Avatar",
  component: Avatar,
  parameters: {
    backgrounds: { default: "dark" },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    url: "assets/sample.png",
    variant: "active",
  },
};

export const Inactive: Story = {
  args: {
    ...Active.args,
    variant: "inactive",
  },
};
export const Ready: Story = {
  args: {
    ...Active.args,
    variant: "ready",
  },
};

export const Big: Story = {
  args: {
    ...Active.args,
    size: 100,
  },
};
