import type { Meta, StoryObj } from "@storybook/react-vite";
import dayjs from "dayjs";
import { Timer } from "./Timer";

const meta = {
  title: "molecules/Timer",
  component: Timer,
} satisfies Meta<typeof Timer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { timerEnds: null } };
export const Running: Story = {
  args: { timerEnds: dayjs().add(5, "minute").valueOf() },
};
export const Expiring: Story = {
  args: { timerEnds: dayjs().add(8, "second").valueOf() },
};
export const Finished: Story = {
  args: { timerEnds: dayjs().subtract(1, "second").valueOf() },
};
