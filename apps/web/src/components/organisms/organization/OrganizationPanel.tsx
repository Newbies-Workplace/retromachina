import { useState } from "react";
import type { OrganizationMemberRequest } from "shared/model/organization/organization.request";
import type { OrganizationDetailsResponse } from "shared/model/organization/organization.response";
import {
  PageCardContent,
  PageCardHeader,
} from "@/components/molecules/page_card/PageCard";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { organizationTeamUrl, organizationUrl } from "@/utils/organization-url";

interface Props {
  organization: OrganizationDetailsResponse;
  currentUserId: string;
  busy?: boolean;
  error?: string;
  onCreateTeam: () => void;
  onPutMember: (request: OrganizationMemberRequest) => void;
  onRemoveMember: (id: string) => void;
}

const roleLabels = {
  OWNER: "Właściciel",
  ADMIN: "Administrator",
  USER: "Członek",
};

export function OrganizationPanel({
  organization,
  currentUserId,
  busy,
  error,
  onCreateTeam,
  onPutMember,
  onRemoveMember,
}: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const canManage = organization.role !== "USER";
  return (
    <>
      <PageCardHeader>{organization.name}</PageCardHeader>
      <PageCardContent className="gap-6">
        <div className="flex flex-col gap-1">
          <a
            className="break-all text-sm underline"
            href={organizationUrl(organization.slug)}
          >
            {organizationUrl(organization.slug)}
          </a>
          <p className="text-sm text-muted-foreground">
            Twoja rola: {roleLabels[organization.role]}
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <section
          className="flex flex-col gap-3"
          aria-labelledby="organization-teams"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="organization-teams" className="font-semibold">
              Zespoły
            </h2>
            {canManage && (
              <Button type="button" onClick={onCreateTeam} disabled={busy}>
                Stwórz zespół
              </Button>
            )}
          </div>
          {!organization.teams.length && (
            <p className="text-sm text-muted-foreground">
              Brak dostępnych zespołów w tej organizacji.
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {organization.teams.map((team) => (
              <li key={team.id} className="rounded-lg border border-border p-3">
                {team.canAccess ? (
                  <a
                    className="font-medium underline"
                    href={organizationTeamUrl(organization.slug, team.slug)}
                  >
                    {team.name}
                  </a>
                ) : (
                  <span className="font-medium">{team.name}</span>
                )}
                <p className="break-all text-xs text-muted-foreground">
                  {organizationTeamUrl(organization.slug, team.slug)}
                </p>
                {!team.canAccess && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dostęp wymaga członkostwa w zespole.
                  </p>
                )}
              </li>
            ))}
          </ul>
          {canManage && (
            <p className="text-sm text-muted-foreground">
              Istniejący zespół możesz przypisać do organizacji w jego
              ustawieniach, jeśli jesteś jego właścicielem.
            </p>
          )}
        </section>
        {canManage && (
          <section
            className="flex flex-col gap-4"
            aria-labelledby="organization-members"
          >
            <h2 id="organization-members" className="font-semibold">
              Członkowie organizacji
            </h2>
            <ul className="flex flex-col gap-3">
              {organization.members.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">{member.nick}</p>
                    <p className="break-all text-xs text-muted-foreground">
                      {member.email} · {roleLabels[member.role]}
                    </p>
                  </div>
                  {member.role !== "OWNER" && member.id !== currentUserId && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          onPutMember({
                            email: member.email,
                            role: member.role === "ADMIN" ? "USER" : "ADMIN",
                          })
                        }
                      >
                        {member.role === "ADMIN"
                          ? "Zmień na członka"
                          : "Nadaj administratora"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => onRemoveMember(member.id)}
                      >
                        Usuń
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                onPutMember({ email: email.trim(), role });
              }}
            >
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="organization-member-email">
                    Dodaj członka — adres e-mail
                  </FieldLabel>
                  <Input
                    id="organization-member-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={busy}
                  />
                  <FieldDescription>
                    Użytkownik musi wcześniej zalogować się do aplikacji.
                    Członkostwo organizacji nie dodaje go automatycznie do
                    zespołów.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="organization-member-role">
                    Rola
                  </FieldLabel>
                  <Select
                    value={role}
                    disabled={busy}
                    onValueChange={(value) =>
                      setRole(value === "ADMIN" ? "ADMIN" : "USER")
                    }
                    itemToStringLabel={(value) =>
                      roleLabels[value as "ADMIN" | "USER"]
                    }
                  >
                    <SelectTrigger id="organization-member-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="USER">Członek</SelectItem>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <Button type="submit" disabled={busy || !email.trim()}>
                Dodaj członka
              </Button>
            </form>
          </section>
        )}
      </PageCardContent>
    </>
  );
}
