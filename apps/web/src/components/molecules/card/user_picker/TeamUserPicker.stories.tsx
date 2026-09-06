import type { Meta, StoryObj } from "@storybook/react-vite";
import { TeamUserPicker } from "./TeamUserPicker";

const meta = {
  title: "molecules/card/TeamUserPicker",
  component: TeamUserPicker,
  args: { onUserPicked: () => {} },
  parameters: {
    docs: {
      description: {
        component:
          "Lista członków zespołu służąca do przypisania autora karty.",
      },
    },
  },
} satisfies Meta<typeof TeamUserPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    teamUsers: [
      { id: "1", name: "Anna", avatar: "" },
      { id: "2", name: "Michał", avatar: "" },
    ],
  },
};

export const WithUnassignedOption: Story = {
  args: {
    canPickUnassigned: true,
    teamUsers: [{ id: "1", name: "Anna", avatar: "" }],
  },
};
