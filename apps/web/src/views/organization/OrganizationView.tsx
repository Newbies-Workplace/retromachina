import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { OrganizationMemberRequest } from "shared/model/organization/organization.request";
import type { OrganizationDetailsResponse } from "shared/model/organization/organization.response";
import { OrganizationService } from "@/api/Organization.service";
import {
  PageCard,
  PageCardContent,
} from "@/components/molecules/page_card/PageCard";
import Navbar from "@/components/organisms/navbar/Navbar";
import { OrganizationPanel } from "@/components/organisms/organization/OrganizationPanel";
import { ResponsivePageLayout } from "@/components/organisms/responsive_page_layout/ResponsivePageLayout";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/context/confirm/ConfirmContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { organizationSubdomain } from "@/utils/organization-url";

export function OrganizationView() {
  const { organizationId: routeId } = useParams();
  const { user, refreshUser } = useUser();
  const id =
    routeId ??
    user?.organizations.find(
      (organization) => organization.slug === organizationSubdomain(),
    )?.id;
  const navigate = useNavigate();
  const { showConfirm } = useConfirm();
  const [organization, setOrganization] =
    useState<OrganizationDetailsResponse>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    OrganizationService.get(id)
      .then((response) => {
        if (!cancelled) {
          setOrganization(response);
          setError(undefined);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Nie udało się otworzyć organizacji. Sprawdź swoje członkostwo.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  const mutate = async (action: () => Promise<unknown>) => {
    if (!id || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await action();
      setOrganization(await OrganizationService.get(id));
      await refreshUser();
    } catch (failure) {
      setError(
        isAxiosError(failure) && failure.response?.status === 404
          ? "Użytkownik musi najpierw zalogować się do aplikacji."
          : "Nie udało się zapisać zmiany. Sprawdź swoje uprawnienia i spróbuj ponownie.",
      );
    } finally {
      setBusy(false);
    }
  };
  const putMember = (request: OrganizationMemberRequest) => {
    if (id) void mutate(() => OrganizationService.putMember(id, request));
  };
  const removeMember = (memberId: string) => {
    if (id)
      showConfirm({
        title: "Usuń członka organizacji",
        content:
          "Usunąć członkostwo w organizacji? Dostęp do zespołów pozostanie bez zmian.",
        onConfirmed: () =>
          mutate(() => OrganizationService.removeMember(id, memberId)),
      });
  };
  const currentOrganization =
    organization?.id === id ? organization : undefined;
  return (
    <>
      <Navbar />
      <ResponsivePageLayout>
        <PageCard className="max-w-3xl">
          {currentOrganization && user ? (
            <OrganizationPanel
              organization={currentOrganization}
              currentUserId={user.id}
              busy={busy}
              error={error}
              onPutMember={putMember}
              onRemoveMember={removeMember}
              onCreateTeam={() => navigate(`/team/create?organizationId=${id}`)}
            />
          ) : (
            <PageCardContent>
              {!id || error ? (
                <p role="alert">
                  {error ??
                    "Nie należysz do tej organizacji lub organizacja nie istnieje."}
                </p>
              ) : (
                <Spinner aria-label="Ładowanie organizacji" />
              )}
            </PageCardContent>
          )}
        </PageCard>
      </ResponsivePageLayout>
    </>
  );
}
