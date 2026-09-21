import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  PageCard,
  PageCardContent,
  PageCardHeader,
} from "@/components/molecules/page_card/PageCard";
import { ResponsivePageLayout } from "./ResponsivePageLayout";

const meta = {
  title: "organisms/ResponsivePageLayout",
  component: ResponsivePageLayout,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ResponsivePageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <PageCard>
        <PageCardHeader>Responsywny układ strony</PageCardHeader>
        <PageCardContent className="min-h-72">
          <p className="text-muted-foreground">
            Zawartość dopasowuje się do szerokości widoku, pozostając w karcie o
            ograniczonej maksymalnej szerokości.
          </p>
        </PageCardContent>
      </PageCard>
    ),
  },
};
