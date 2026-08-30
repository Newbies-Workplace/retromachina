import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardCount } from "@/components/atoms/card_indicator/CardIndicator";

const meta = {
  title: "atoms/CardIndicator",
  component: CardCount,
  tags: ["autodocs"],
} satisfies Meta<typeof CardCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (props) => <CardCount {...props} />,
  args: { count: 12 },
};

export const WithWritingIndicator: Story = {
  render: (props) => <CardCount {...props} />,
  args: { count: 0, isWriting: true },
};
