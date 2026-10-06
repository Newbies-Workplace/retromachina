import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuOrganizations } from "./MenuOrganizations";

const meta = {
  title: "organisms/MenuOrganizations",
  component: MenuOrganizations,
  decorators: [
    (Story) => (
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger>Menu konta</DropdownMenuTrigger>
        <DropdownMenuContent className="w-72">
          <Story />
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  ],
} satisfies Meta<typeof MenuOrganizations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    organizations: [
      { id: "example", name: "Example", slug: "example", role: "OWNER" },
    ],
  },
};

export const MultipleOrganizations: Story = {
  args: {
    organizations: [
      {
        id: "first",
        name: "Organizacja produktu",
        slug: "produkt",
        role: "OWNER",
      },
      {
        id: "second",
        name: "Organizacja z bardzo długą nazwą wymagającą skrócenia",
        slug: "druga",
        role: "ADMIN",
      },
      { id: "third", name: "Społeczność", slug: "spolecznosc", role: "USER" },
    ],
  },
};

export const WithoutOrganizations: Story = {
  args: { organizations: [] },
};
