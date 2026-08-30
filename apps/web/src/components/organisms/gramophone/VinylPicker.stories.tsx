import type { Meta, StoryObj } from "@storybook/react-vite";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VINYLS } from "./Vinyl";
import { VinylPicker } from "./VinylPicker";

const meta = {
  title: "organisms/gramophone/VinylPicker",
  component: VinylPicker,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof VinylPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NonePlaying: Story = { args: { activeVinyl: null } };
export const WithActiveVinyl: Story = { args: { activeVinyl: VINYLS[0] } };
