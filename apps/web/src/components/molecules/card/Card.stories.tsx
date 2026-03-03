import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardActions,
  CardAuthor,
  CardContent,
} from "@/components/molecules/card/Card";
import Counter from "@/components/molecules/counter/Counter";

const meta = {
  title: "molecules/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card id="1">
      <CardContent text="Test" />
      <CardAuthor
        author={{
          id: "aaa",
          avatar: "assets/sample.png",
          name: "John Doe",
        }}
      />
    </Card>
  ),
};

export const WithEditableAuthor: Story = {
  render: () => (
    <Card id="1">
      <CardContent text="Test" />
      <CardAuthor
        author={{
          id: "aaa",
          avatar: "assets/sample.png",
          name: "John Doe",
        }}
        teamUsers={[
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
        ]}
        editable
      />
    </Card>
  ),
};

export const WithoutAuthor: Story = {
  render: () => (
    <Card id="1">
      <CardContent text="Test" />
      <CardAuthor author={null} />
    </Card>
  ),
};

export const WithEditableText: Story = {
  render: () => (
    <Card id="1">
      <CardContent text="click me" editable />
      <CardAuthor
        author={{
          id: "aaa",
          avatar: "assets/sample.png",
          name: "John Doe",
        }}
      />
    </Card>
  ),
};

export const WithCounter: Story = {
  render: () => (
    <Card id="1">
      <CardContent text="count count" />
      <CardAuthor
        author={{
          id: "aaa",
          avatar: "assets/sample.png",
          name: "John Doe",
        }}
      />
      <CardActions>
        <Counter
          canIncrement={true}
          count={12}
          onIncrement={() => {}}
          onDecrement={() => {}}
        />
      </CardActions>
    </Card>
  ),
};
