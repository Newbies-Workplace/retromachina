import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlotMachine } from "./SlotMachine";

const users = [{ id: "1" }, { id: "2" }, { id: "3" }];

const meta = {
  title: "organisms/SlotMachine",
  component: SlotMachine,
  args: { onMachineDrawn: () => {}, userPool: users },
} satisfies Meta<typeof SlotMachine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHighlightedUser: Story = {
  args: { highlightedUserId: "2" },
};

export const Dismissible: Story = {
  args: { hideMachineEnabled: true, onHideMachine: () => {} },
};
