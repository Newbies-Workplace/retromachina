import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ActivePokerUser } from "shared/model/poker/poker.events";
import type { PokerCard } from "shared/model/poker/poker.types";
import { PokerTable } from "@/views/poker/components/PokerTable";

const meta = {
  title: "views/poker/PokerTable",
  component: PokerTable,
  args: {
    currentUserId: "user-1",
    cardsRevealed: true,
    onRevealCards: () => {},
    onClearTable: () => {},
  },
  decorators: [
    (Story) => (
      <div className="h-[640px] bg-background p-8 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PokerTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const cards: PokerCard[] = ["1", "2", "4", "8", "16", "24", "32"];

const createPokerUsers = (count: number): ActivePokerUser[] => {
  return Array.from({ length: count }, (_, index) => {
    const card = cards[index % cards.length];

    return {
      userId: `user-${index + 1}`,
      avatarLink: "",
      role: "USER",
      selectedCard: card,
      revealedCard: index % 5 === 0 ? null : card,
    };
  });
};

export const FourPlayers: Story = {
  args: {
    users: createPokerUsers(4),
  },
};

export const EightPlayers: Story = {
  args: {
    users: createPokerUsers(8),
  },
};

export const TwelvePlayers: Story = {
  args: {
    users: createPokerUsers(12),
  },
};

export const TwentyPlayers: Story = {
  args: {
    users: createPokerUsers(20),
  },
};

export const HiddenCards: Story = {
  args: {
    cardsRevealed: false,
    users: createPokerUsers(12),
  },
};
