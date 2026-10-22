import type { Meta, StoryObj } from "@storybook/react-vite";
import type { OrganizationDetailsResponse } from "shared/model/organization/organization.response";
import { PageCard } from "@/components/molecules/page_card/PageCard";
import { OrganizationPanel } from "./OrganizationPanel";

const organization: OrganizationDetailsResponse = {
  id: "org",
  name: "Example",
  slug: "example",
  role: "OWNER",
  teams: [
    {
      id: "team",
      name: "Zespół produktu",
      slug: "zespol-produktu",
      canAccess: true,
    },
    { id: "other", name: "Inny zespół", slug: "inny", canAccess: false },
  ],
  members: [
    {
      id: "owner",
      nick: "Właściciel",
      email: "owner@example.com",
      avatar_link: "",
      role: "OWNER",
    },
    {
      id: "member",
      nick: "Członek",
      email: "member@example.com",
      avatar_link: "",
      role: "USER",
    },
  ],
};
const meta = {
  title: "organisms/OrganizationPanel",
  component: OrganizationPanel,
  args: {
    organization,
    currentUserId: "owner",
    onCreateTeam: () => {},
    onPutMember: () => {},
    onRemoveMember: () => {},
  },
  decorators: [
    (Story) => (
      <PageCard className="max-w-3xl">
        <Story />
      </PageCard>
    ),
  ],
} satisfies Meta<typeof OrganizationPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Owner: Story = {};
export const Administrator: Story = {
  args: {
    organization: { ...organization, role: "ADMIN" },
    currentUserId: "admin",
  },
};
export const Member: Story = {
  args: {
    organization: {
      ...organization,
      role: "USER",
      teams: organization.teams.filter((team) => team.canAccess),
      members: [],
    },
    currentUserId: "member",
  },
};
export const Empty: Story = {
  args: { organization: { ...organization, teams: [], members: [] } },
};
export const SaveError: Story = {
  args: { error: "Nie udało się zapisać zmiany." },
};
export const Saving: Story = { args: { busy: true } };
