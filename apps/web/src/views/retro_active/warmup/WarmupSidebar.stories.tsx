import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WarmupSidebar } from "./WarmupSidebar";

const candidate = {
  id: "giphy",
  name: "GIPHY",
  description: "Znajdź GIF",
  url: "https://giphy.com",
  shouldWaitForRoomCreation: false,
};
const meta = {
  title: "retro/warmup/WarmupSidebar",
  component: WarmupSidebar,
  args: {
    isAdmin: true,
    onShare: () => {},
    warmup: {
      candidates: [candidate],
      status: "revealed",
      selectedWarmupId: null,
      result: candidate,
      spinEndsAt: null,
      sharedRoomUrl: null,
      sharedRoomUrlRevision: 0,
      sharedRoomUrlUpdatedBy: null,
    },
  },
  decorators: [
    (Story) => (
      <SidebarProvider className="min-h-[600px]">
        <Story />
      </SidebarProvider>
    ),
  ],
} satisfies Meta<typeof WarmupSidebar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Selected: Story = {};
export const Pending: Story = {
  args: { warmup: { ...meta.args.warmup, status: "pending", result: null } },
};
export const Spinning: Story = {
  args: { warmup: { ...meta.args.warmup, status: "spinning" } },
};
export const RoomRequired: Story = {
  args: {
    warmup: {
      ...meta.args.warmup,
      result: { ...candidate, shouldWaitForRoomCreation: true },
    },
  },
};
export const Member: Story = { args: { ...RoomRequired.args, isAdmin: false } };
