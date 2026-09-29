import type { Meta, StoryObj } from "@storybook/react-vite";
import { WarmupChooser } from "./WarmupChooser";

const meta = {
  title: "retro/create/WarmupChooser",
  component: WarmupChooser,
  args: {
    warmups: [
      {
        id: "giphy",
        name: "GIPHY",
        description: null,
        url: "https://giphy.com",
        source: "default",
        shouldWaitForRoomCreation: false,
      },
    ],
    warmupChoice: "random",
    onChange: () => {},
  },
} satisfies Meta<typeof WarmupChooser>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Random: Story = {};
export const None: Story = { args: { warmupChoice: "none" } };
export const Selected: Story = { args: { warmupChoice: "selected:giphy" } };
export const Empty: Story = { args: { warmups: [] } };
