import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "@/components/molecules/card/Card";
import Counter from "@/components/molecules/counter/Counter";

const meta = {
  title: "molecules/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "1",
    text: "Test",
    author: {
      id: "aaa",
      avatar: "assets/sample.png",
      name: "John Doe",
    },
    teamUsers: [],
  },
};
export const WithEditableAuthor: Story = {
  args: {
    ...Default.args,
    text: "Test",
    editableUser: true,
    teamUsers: [
      {
        id: "bbb",
        avatar: "assets/sample.png",
        name: "John Doe 2",
      },
      {
        id: "cc",
        avatar: "assets/sample.png",
        name: "John Doe 3",
      },
    ],
  },
};

export const WithoutAuthor: Story = {
  args: {
    ...Default.args,
    author: undefined,
    text: "Test",
    teamUsers: [],
  },
};

export const WithEditableText: Story = {
  args: {
    ...Default.args,
    text: "click me",
    editableText: true,
  },
};

export const WithCounter: Story = {
  args: {
    ...Default.args,
    text: "count count",
    children: (
      <Counter
        canIncrement={true}
        count={12}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />
    ),
  },
};
