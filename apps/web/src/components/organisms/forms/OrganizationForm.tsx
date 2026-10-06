import { useState } from "react";
import type { OrganizationRequest } from "shared/model/organization/organization.request";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface Props {
  onSubmit: (request: OrganizationRequest) => void;
  busy?: boolean;
  error?: string;
}

export function OrganizationForm({ onSubmit, busy, error }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const rootDomain = process.env.RETRO_WEB_ROOT_DOMAIN || "retromachine.eu";
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name: name.trim(), slug });
      }}
      className="flex flex-col gap-5"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="organization-name">Nazwa organizacji</FieldLabel>
          <Input
            id="organization-name"
            required
            maxLength={191}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={busy}
            autoComplete="organization"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="organization-slug">Subdomena</FieldLabel>
          <Input
            id="organization-slug"
            required
            maxLength={63}
            pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            disabled={busy}
            aria-describedby="organization-address"
            autoComplete="off"
          />
          <FieldDescription id="organization-address">
            {slug || "organizacja"}.{rootDomain}. Adres jest stały; użyj małych
            liter, cyfr i myślników.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !name.trim() || !slug}>
        {busy ? "Tworzenie…" : "Stwórz organizację"}
      </Button>
    </form>
  );
}
