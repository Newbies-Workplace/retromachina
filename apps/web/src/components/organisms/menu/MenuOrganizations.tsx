import type { OrganizationMembershipResponse } from "shared/model/organization/organization.response";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { organizationUrl } from "@/utils/organization-url";

interface MenuOrganizationsProps {
  organizations: OrganizationMembershipResponse[];
}

const roleLabels = {
  OWNER: "Właściciel",
  ADMIN: "Administrator",
  USER: "Członek",
};

export const MenuOrganizations = ({
  organizations,
}: MenuOrganizationsProps) => {
  if (!organizations.length) return null;

  return (
    <>
      <DropdownMenuLabel className="px-3 text-xs text-muted-foreground">
        Organizacje
      </DropdownMenuLabel>
      <DropdownMenuGroup
        className="flex flex-col gap-1"
        aria-label="Twoje organizacje"
      >
        {organizations.map((organization) => (
          <DropdownMenuItem key={organization.id} asChild>
            <a
              href={organizationUrl(organization.slug)}
              className="flex min-w-0 flex-col items-start px-3 py-1"
            >
              <span
                className="truncate text-sm font-medium"
                title={organization.name}
              >
                {organization.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {roleLabels[organization.role]}
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator className="mx-1 my-2" />
    </>
  );
};
