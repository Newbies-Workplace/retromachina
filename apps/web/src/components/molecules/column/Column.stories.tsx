import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardAuthor,
  CardContent,
} from "@/components/molecules/card/Card";
import { Column } from "./Column";

const meta = {
  title: "molecules/Column",
  component: Column,
} satisfies Meta<typeof Column>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCards: Story = {
  args: {
    columnData: { name: "Co poszło dobrze?", description: "Sukcesy zespołu" },
    children: (
      <Card id="example-card">
        <CardContent text="Dobra współpraca" />
        <CardAuthor author={{ id: "1", name: "Jan", avatar: "" }} />
      </Card>
    ),
  },
};
