import type { Meta, StoryObj } from "@storybook/react-vite";
import { VINYLS } from "./Vinyl";
import { VinylDisc } from "./VinylDisc";

const meta = {
  title: "organisms/gramophone/VinylDisc",
  component: VinylDisc,
} satisfies Meta<typeof VinylDisc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Voyager: Story = { args: { data: VINYLS[0] } };
export const Elevator: Story = { args: { data: VINYLS[3] } };
