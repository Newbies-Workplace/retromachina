import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavbarAction } from "./NavbarAction";

const meta = {
  title: "organisms/NavbarAction",
  component: NavbarAction,
} satisfies Meta<typeof NavbarAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <Button size="icon">
        <SettingsIcon />
      </Button>
    ),
  },
};
