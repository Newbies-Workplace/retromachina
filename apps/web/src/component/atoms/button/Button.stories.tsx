import type { Meta, StoryObj } from "@storybook/react";
import ActionIcon from "../../../assets/icons/action-icon.svg";
import { Button } from "./Button";

const meta = {
  title: "atoms/Button",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {
  args: {
    size: "md",
    children: "Test button",
  },
};

export const Large: Story = {
  args: {
    ...Medium.args,
    size: "lg",
  },
};

export const Small: Story = {
  args: {
    ...Medium.args,
    size: "sm",
  },
};

export const Disabled: Story = {
  args: {
    ...Medium.args,
    disabled: true,
  },
};

export const Icon: Story = {
  args: {
    size: "icon",
    children: <ActionIcon className={"size-6"} />,
  },
};
