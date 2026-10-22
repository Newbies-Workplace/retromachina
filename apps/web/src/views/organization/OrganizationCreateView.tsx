import { isAxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { OrganizationRequest } from "shared/model/organization/organization.request";
import { OrganizationService } from "@/api/Organization.service";
import {
  PageCard,
  PageCardContent,
  PageCardHeader,
} from "@/components/molecules/page_card/PageCard";
import { OrganizationForm } from "@/components/organisms/forms/OrganizationForm";
import Navbar from "@/components/organisms/navbar/Navbar";
import { ResponsivePageLayout } from "@/components/organisms/responsive_page_layout/ResponsivePageLayout";
import { useUser } from "@/context/user/UserContext.hook";

export function OrganizationCreateView() {
  const { refreshUser } = useUser();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const create = async (request: OrganizationRequest) => {
    setBusy(true);
    setError(undefined);
    try {
      const organization = await OrganizationService.create(request);
      await refreshUser();
      navigate(`/organizations/${organization.id}`);
    } catch (failure) {
      setError(
        isAxiosError(failure) && failure.response?.status === 409
          ? "Ta subdomena jest już zajęta."
          : isAxiosError(failure) && failure.response?.status === 400
            ? "Sprawdź nazwę i subdomenę. Nazwy systemowe, np. www i api, są zarezerwowane."
            : "Nie udało się utworzyć organizacji. Spróbuj ponownie.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Navbar />
      <ResponsivePageLayout>
        <PageCard className="max-w-2xl">
          <PageCardHeader>Stwórz organizację</PageCardHeader>
          <PageCardContent>
            <OrganizationForm onSubmit={create} busy={busy} error={error} />
          </PageCardContent>
        </PageCard>
      </ResponsivePageLayout>
    </>
  );
}
