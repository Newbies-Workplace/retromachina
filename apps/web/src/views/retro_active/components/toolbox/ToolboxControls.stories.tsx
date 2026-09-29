import type { Meta, StoryObj } from "@storybook/react-vite";
import type { WarmupState } from "shared/model/warmup/warmup";
import {
  ToolboxNavigation,
  ToolboxReadyControl,
  ToolboxSecondaryAction,
  ToolboxVoteControl,
} from "./ToolboxControls";

const meta = {
  title: "retro/toolbar/ToolboxControls",
  component: ToolboxNavigation,
  args: {
    isAdmin: true,
    isWarmup: false,
    warmup: null,
    startWarmupDraw: () => {},
    completeWarmup: () => {},
    nextRoomState: () => {},
    prevRoomState: () => {},
    nextDisabled: false,
    prevDisabled: false,
  },
  decorators: [
    (Story) => (
      <div className="relative h-16 w-24">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolboxNavigation>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Navigation: Story = {};
export const DisabledPrevious: Story = { args: { prevDisabled: true } };
const pendingWarmup: WarmupState = {
  candidates: [],
  status: "pending",
  selectedWarmupId: null,
  result: null,
  spinEndsAt: null,
  sharedRoomUrl: null,
  sharedRoomUrlRevision: 0,
  sharedRoomUrlUpdatedBy: null,
};
export const WarmupPending: Story = {
  args: {
    isWarmup: true,
    warmup: {
      candidates: [],
      status: "pending",
      selectedWarmupId: null,
      result: null,
      spinEndsAt: null,
      sharedRoomUrl: null,
      sharedRoomUrlRevision: 0,
      sharedRoomUrlUpdatedBy: null,
    },
  },
};
export const WarmupSpinning: Story = {
  args: {
    ...WarmupPending.args,
    warmup: { ...pendingWarmup, status: "spinning" },
  },
};
export const WarmupRevealed: Story = {
  args: {
    ...WarmupPending.args,
    warmup: { ...pendingWarmup, status: "revealed" },
  },
};
export const Ready: Story = {
  render: () => (
    <ToolboxReadyControl
      ready={false}
      setReady={() => {}}
      readyPercentage={50}
    />
  ),
};
export const Voting: Story = {
  render: () => (
    <ToolboxVoteControl maxVotes={3} setMaxVotesAmount={() => {}} />
  ),
};

export const ReflectionShelf: Story = {
  render: () => (
    <ToolboxSecondaryAction
      isWarmup={false}
      roomState="reflection"
      isAdmin
      warmupUrl={undefined}
      onOpenWarmupLink={() => {}}
      shelfButtonRef={{ current: null }}
      onOpenShelf={() => {}}
      hasReflectionCards
      maxVotes={3}
      setMaxVotesAmount={() => {}}
    />
  ),
};
