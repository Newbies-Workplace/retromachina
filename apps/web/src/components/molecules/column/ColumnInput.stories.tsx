import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ColumnInput } from "./ColumnInput";

const meta = {
  title: "molecules/ColumnInput",
  component: ColumnInput,
  args: {
    columnData: {
      id: "went-well",
      name: "Co poszło dobrze?",
      description: "Sukcesy zespołu",
      cards: [],
      isWriting: false,
      teamCardsAmount: 3,
    },
    onCardCreated: () => {},
    onIsWriting: () => {},
  },
} satisfies Meta<typeof ColumnInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [createdCards, setCreatedCards] = useState<string[]>([]);
    return (
      <div className="w-75">
        <ColumnInput
          {...args}
          onCardCreated={(text) => setCreatedCards((cards) => [...cards, text])}
        />
        {createdCards.length > 0 && (
          <p className="text-sm">Dodano: {createdCards.join(", ")}</p>
        )}
      </div>
    );
  },
};
