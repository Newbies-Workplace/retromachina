import type { Meta, StoryObj } from "@storybook/react-vite";
import { OrganizationForm } from "./OrganizationForm";

const meta = {
  title: "organisms/forms/OrganizationForm",
  component: OrganizationForm,
  args: { onSubmit: () => {} },
  decorators: [
    (Story) => (
      <div className="max-w-lg p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrganizationForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Saving: Story = { args: { busy: true } };
export const TakenSubdomain: Story = {
  args: { error: "Ta subdomena jest już zajęta." },
};
