import type { Meta, StoryObj } from "@storybook/react-vite";
import { TeamOrganizationPicker } from "./TeamOrganizationPicker";

const organizations = [
  { id: "org", name: "Example", slug: "example", role: "OWNER" as const },
];
const meta = {
  title: "organisms/forms/TeamOrganizationPicker",
  component: TeamOrganizationPicker,
  args: { organizations, organizationId: null, onChange: () => {} },
  decorators: [
    (Story) => (
      <div className="max-w-lg p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TeamOrganizationPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithoutOrganization: Story = {};
export const Selected: Story = { args: { organizationId: "org" } };
export const NotOwner: Story = {
  args: { organizationId: "org", disabled: true },
};
export const NoMemberships: Story = { args: { organizations: [] } };
