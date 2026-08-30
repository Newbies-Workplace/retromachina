import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BoardCreatorColumn } from "./BoardCreatorColumn";

const meta = {
  title: "molecules/BoardCreatorColumn",
  component: BoardCreatorColumn,
  args: { id: "went-well", onChange: () => {}, onDelete: () => {} },
} satisfies Meta<typeof BoardCreatorColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [column, setColumn] = useState({
      name: "Co poszło dobrze?",
      desc: "Sukcesy zespołu",
    });
    return (
      <BoardCreatorColumn
        {...args}
        {...column}
        onChange={(nextColumn) =>
          setColumn({
            name: nextColumn.name,
            desc: nextColumn.desc ?? "",
          })
        }
      />
    );
  },
};

export const WithDescription: Story = {
  render: (args) => {
    const [column, setColumn] = useState({
      name: "Do poprawy",
      desc: "Co zrobimy inaczej następnym razem?",
    });
    return (
      <BoardCreatorColumn
        {...args}
        {...column}
        withDescription
        onChange={(nextColumn) =>
          setColumn({
            name: nextColumn.name,
            desc: nextColumn.desc ?? "",
          })
        }
      />
    );
  },
};
