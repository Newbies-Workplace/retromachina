import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageCard, PageCardContent, PageCardHeader } from "./PageCard";

const meta = {
  title: "molecules/PageCard",
  component: PageCard,
} satisfies Meta<typeof PageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageCard>
      <PageCardHeader>Tytuł strony</PageCardHeader>
      <PageCardContent>
        <p>Wspólna zawartość responsywnej karty.</p>
      </PageCardContent>
    </PageCard>
  ),
};
