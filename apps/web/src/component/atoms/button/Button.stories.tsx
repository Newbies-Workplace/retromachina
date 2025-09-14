import type { Meta, StoryObj } from "@storybook/react-vite";
import { SaveIcon } from "lucide-react";
import { Button } from "@/component/atoms/button/Button";

const meta = {
  title: "atoms/Button",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    children: "Test button",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    ...Small.args,
    size: "md",
  },
};

export const Large: Story = {
  args: {
    ...Small.args,
    size: "lg",
  },
};

export const ExtraLarge: Story = {
  args: {
    ...Small.args,
    size: "xl",
  },
};

export const Disabled: Story = {
  args: {
    ...Small.args,
    disabled: true,
  },
};

export const Icon: Story = {
  args: {
    size: "icon",
    children: <SaveIcon className={"size-6"} />,
  },
};
