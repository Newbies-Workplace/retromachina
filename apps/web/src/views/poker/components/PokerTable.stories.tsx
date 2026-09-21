import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import type { ActivePokerUser } from "shared/model/poker/poker.events";
import type { PokerCard } from "shared/model/poker/poker.types";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { PokerTable } from "@/views/poker/components/PokerTable";

type PokerTableArgs = ComponentProps<typeof PokerTable>;

const InteractivePokerTableStory = () => {
  const [args, updateArgs] = useArgs<PokerTableArgs>();

  const revealCards = () => {
    args.onRevealCards();
    updateArgs({
      cardsRevealed: true,
      users: args.users.map((user, index) => {
        const card = user.selectedCard ?? cards[index % cards.length];

        return {
          ...user,
          selectedCard: card,
          revealedCard: card,
        };
      }),
    });
  };

  const clearTable = () => {
    args.onClearTable();
    updateArgs({
      cardsRevealed: false,
      users: args.users.map((user) => ({
        ...user,
        selectedCard: null,
        revealedCard: null,
      })),
    });
  };

  return (
    <PokerTable
      {...args}
      onRevealCards={revealCards}
      onClearTable={clearTable}
    />
  );
};

const meta = {
  title: "views/poker/PokerTable",
  component: PokerTable,
  render: InteractivePokerTableStory,
  args: {
    currentUserId: "user-1",
    cardsRevealed: true,
    onRevealCards: fn(),
    onClearTable: fn(),
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
      nick: `Użytkownik ${index + 1}`,
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
