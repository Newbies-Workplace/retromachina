import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  title: "molecules/ConfirmDialog",
  component: ConfirmDialog,
  parameters: { layout: "fullscreen" },
  args: { onConfirmed: () => {}, onDismiss: () => {} },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeleteTeam: Story = {
  args: { title: "Usunąć zespół?", content: "Ta operacja jest nieodwracalna." },
};
