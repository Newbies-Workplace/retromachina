import type { Meta, StoryObj } from "@storybook/react-vite";
import { GramophonePlayer } from "./GramophonePlayer";
import { VINYLS } from "./Vinyl";

const meta = {
  title: "organisms/gramophone/GramophonePlayer",
  component: GramophonePlayer,
  args: { onVinylDropped: () => {} },
} satisfies Meta<typeof GramophonePlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { activeVinyl: null } };
export const Playing: Story = { args: { activeVinyl: VINYLS[0] } };
