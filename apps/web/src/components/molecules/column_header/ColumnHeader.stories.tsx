import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from "./ColumnHeader";

const meta = {
  title: "molecules/ColumnHeader",
  component: ColumnHeader,
} satisfies Meta<typeof ColumnHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { header: "Co poszło dobrze?" } };
export const WithDescriptionAndAction: Story = {
  args: {
    header: "Do poprawy",
    description: "Obszary, które warto omówić podczas retrospektywy.",
    right: (
      <Button size="icon" variant="ghost">
        <MoreHorizontalIcon />
      </Button>
    ),
  },
};
