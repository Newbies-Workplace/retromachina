import type { Meta, StoryObj } from "@storybook/react-vite";
import type { WarmupLink } from "shared/model/warmup/warmup";
import { WarmupWheel } from "./WarmupWheel";

const candidates: WarmupLink[] = [
  {
    id: "gartic-phone",
    name: "Gartic Phone",
    description: "Rysunkowy głuchy telefon.",
    url: "https://garticphone.com/",
  },
  {
    id: "skribbl",
    name: "skribbl.io",
    description: "Rysowanie i zgadywanie haseł.",
    url: "https://skribbl.io/",
  },
  {
    id: "openguessr",
    name: "OpenGuessr",
    description: "Zgadywanie lokalizacji.",
    url: "https://openguessr.com/multiplayer/host",
  },
];

const tenCandidates: WarmupLink[] = Array.from({ length: 10 }, (_, index) => ({
  id: `option-${index + 1}`,
  name: `Opcja ${index + 1}`,
  description: `Opis rozgrzewki ${index + 1}.`,
  url: `https://example.com/warmup-${index + 1}`,
}));

const meta = {
  title: "organisms/WarmupWheel",
  component: WarmupWheel,
  args: {
    candidates,
    status: "pending",
    resultId: null,
    spinEndsAt: null,
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-[460px] items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WarmupWheel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const Spinning: Story = {
  args: {
    status: "spinning",
    resultId: "skribbl",
  },
  render: (args) => <WarmupWheel {...args} spinEndsAt={Date.now() + 4500} />,
};

export const Revealed: Story = {
  args: {
    status: "revealed",
    resultId: "openguessr",
  },
};

export const SingleOption: Story = {
  args: {
    candidates: [candidates[0]],
    status: "revealed",
    resultId: "gartic-phone",
  },
};

export const Compact: Story = {
  args: {
    status: "revealed",
    resultId: "skribbl",
  },
  render: (args) => (
    <div className="w-44">
      <WarmupWheel {...args} />
    </div>
  ),
};

export const TenOptions: Story = {
  args: {
    candidates: tenCandidates,
    status: "revealed",
    resultId: "option-7",
  },
};
