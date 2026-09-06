import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoardCreator } from "./BoardCreator";
import { BoardCreatorColumn } from "./BoardCreatorColumn";

const meta = {
  title: "molecules/BoardCreator",
  component: BoardCreator,
  args: { onColumnReorder: () => {} },
} satisfies Meta<typeof BoardCreator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <BoardCreator {...args}>
      <BoardCreatorColumn
        id="went-well"
        name="Co poszło dobrze?"
        desc=""
        onChange={() => {}}
        onDelete={() => {}}
      />
      <BoardCreatorColumn
        id="improve"
        name="Co poprawić?"
        desc=""
        onChange={() => {}}
        onDelete={() => {}}
      />
    </BoardCreator>
  ),
};
