import type React from "react";
import { useState } from "react";
import { InviteResponse } from "shared/model/invite/Invite.response";
import type { OrganizationMembershipResponse } from "shared/model/organization/organization.response";
import type { TeamRequest } from "shared/model/team/team.request";
import { TeamResponse } from "shared/model/team/team.response";
import { UserInTeamResponse } from "shared/model/user/user.response";
import {
  PageCardContent,
  PageCardHeader,
} from "@/components/molecules/page_card/PageCard";
import { TeamMemberPicker } from "@/components/molecules/team_member_picker/TeamMemberPicker";
import { TeamInviteLinkInput } from "@/components/organisms/forms/TeamInviteLinkInput";
import { WarmupLinksForm } from "@/components/organisms/forms/WarmupLinksForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TeamOrganizationPicker } from "./TeamOrganizationPicker";

interface TeamFormProps {
  team: TeamResponse | null;
  users?: UserInTeamResponse[];
  invites?: InviteResponse[];
  onSubmit: (team: TeamRequest) => void;
  onDelete?: () => void;
  deletable?: boolean;
  organizations?: OrganizationMembershipResponse[];
  initialOrganizationId?: string | null;
  canMove?: boolean;
}

const EMPTY_ORGANIZATIONS: OrganizationMembershipResponse[] = [];

export const TeamForm: React.FC<TeamFormProps> = ({
  team,
  onSubmit,
  onDelete,
  deletable,
  organizations = EMPTY_ORGANIZATIONS,
  initialOrganizationId = null,
  canMove = true,
}) => {
  const [organizationId, setOrganizationId] = useState<string | null>(
    team?.organization_id ?? initialOrganizationId,
  );
  const [name, setName] = useState<string>(team?.name || "");
  const [inviteKey, setInviteKey] = useState<string | undefined>(
    team?.invite_key || "",
  );

  const onSubmitClick = () => {
    onSubmit({
      name: name,
      organization_id: organizationId,
      invite_key: inviteKey && inviteKey.length > 0 ? inviteKey : undefined,
    });
  };

  return (
    <>
      <PageCardHeader>
        {team ? "Zarządzanie zespołem" : "Stworz nowy zespół"}
      </PageCardHeader>

      <PageCardContent className={"grow justify-between gap-5"}>
        <div className={"flex flex-col"}>
          <h1>Team</h1>
          <Input
            data-testid={"team-name"}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={"Nazwa zespołu"}
          />
        </div>

        <TeamOrganizationPicker
          organizations={organizations}
          organizationId={organizationId}
          onChange={setOrganizationId}
          disabled={!!team && !canMove}
        />
        {team && (
          <p className="break-all text-xs text-muted-foreground">
            Slug zespołu: {team.slug}. Zmiana nazwy nie zmienia adresu.
          </p>
        )}

        <TeamInviteLinkInput
          inviteKey={inviteKey}
          setInviteKey={(key) => {
            setInviteKey(key);
          }}
        />
        {!team && (
          <span className={"opacity-40 text-xs"}>
            (Link będzie aktywny po zapisaniu zespołu)
          </span>
        )}

        {team && (
          <>
            <div className={"flex flex-col"}>
              <h1>Członkowie</h1>
              <TeamMemberPicker teamId={team.id} />
            </div>
            <Dialog>
              <DialogTrigger
                render={
                  <Button type="button" variant="outline">
                    Zarządzaj rozgrzewkami
                  </Button>
                }
              />
              <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Rozgrzewki</DialogTitle>
                  <DialogDescription>
                    Własne pozycje są dodawane do domyślnej listy rozgrzewek.
                  </DialogDescription>
                </DialogHeader>
                <WarmupLinksForm teamId={team.id} />
              </DialogContent>
            </Dialog>
          </>
        )}

        <div className={"flex justify-between gap-2 mt-auto w-full"}>
          {deletable ? (
            <Button
              data-testid={"remove-team"}
              variant={"destructive"}
              onClick={onDelete}
            >
              Usuń
            </Button>
          ) : (
            <div />
          )}

          <Button data-testid={"save-team"} onClick={onSubmitClick}>
            Zapisz
          </Button>
        </div>
      </PageCardContent>
    </>
  );
};
