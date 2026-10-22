import type { OrganizationMembershipResponse } from "shared/model/organization/organization.response";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  organizations: OrganizationMembershipResponse[];
  organizationId: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

export function TeamOrganizationPicker({
  organizations,
  organizationId,
  onChange,
  disabled,
}: Props) {
  const choices = organizations.filter(
    (organization) =>
      organization.role !== "USER" || organization.id === organizationId,
  );
  return (
    <Field>
      <FieldLabel htmlFor="team-organization">Organizacja</FieldLabel>
      <Select
        value={organizationId || "none"}
        onValueChange={(value) => onChange(value === "none" ? null : value)}
        disabled={disabled}
        itemToStringLabel={(value) =>
          choices.find((organization) => organization.id === value)?.name ??
          (value === "none" ? "Bez organizacji" : "Obecna organizacja")
        }
      >
        <SelectTrigger id="team-organization" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="none">Bez organizacji</SelectItem>
            {organizationId &&
              !choices.some(
                (organization) => organization.id === organizationId,
              ) && (
                <SelectItem value={organizationId}>
                  Obecna organizacja
                </SelectItem>
              )}
            {choices.map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>
                {organization.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>
        {disabled
          ? "Przenoszenie zespołu jest dostępne dla jego właściciela."
          : "Organizacja jest opcjonalna. Możesz wybrać organizację, którą zarządzasz."}
      </FieldDescription>
    </Field>
  );
}
