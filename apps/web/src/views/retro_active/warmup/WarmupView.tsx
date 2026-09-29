import { LinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WarmupWheel } from "@/components/organisms/warmup_wheel/WarmupWheel";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useTeamRole } from "@/hooks/useTeamRole";
import { cn } from "@/lib/utils";

export function WarmupView() {
  const { teamId, warmup, updateWarmupRoomUrl } = useRetro();
  const { user } = useUser();
  const { isAdmin } = useTeamRole(teamId ?? "");
  const [roomUrl, setRoomUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const previousRevision = useRef(warmup?.sharedRoomUrlRevision ?? 0);

  useEffect(() => {
    const revision = warmup?.sharedRoomUrlRevision ?? 0;
    if (
      revision > previousRevision.current &&
      warmup?.sharedRoomUrlUpdatedBy !== user?.id
    ) {
      setHighlight(true);
      const timeout = setTimeout(() => setHighlight(false), 1600);
      previousRevision.current = revision;
      return () => clearTimeout(timeout);
    }
    previousRevision.current = revision;
  }, [user?.id, warmup?.sharedRoomUrlRevision, warmup?.sharedRoomUrlUpdatedBy]);

  if (!warmup) return null;
  const result = warmup.result;
  const selectedWarmup = warmup.candidates.find(
    (candidate) => candidate.id === warmup.selectedWarmupId,
  );
  const shouldWaitForRoomCreation = result
    ? (result.shouldWaitForRoomCreation ?? result.id !== "default-giphy")
    : true;
  const sidebarTitle =
    warmup.status === "revealed"
      ? (result?.name ?? "Nie wybrano rozgrzewki")
      : warmup.status === "pending"
        ? (selectedWarmup?.name ?? "Nie wybrano rozgrzewki")
        : "Wybór rozgrzewki";

  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar
        variant="floating"
        collapsible="offcanvas"
        className="mt-[70px] h-[calc(100%-70px-100px)]"
      >
        <SidebarHeader>
          <span
            className="line-clamp-2 overflow-hidden text-xl"
            data-testid="warmup-sidebar-title"
          >
            {sidebarTitle}
          </span>
        </SidebarHeader>
        <SidebarContent>
          {warmup.status === "pending" && (
            <div className="p-4 text-sm text-muted-foreground">
              Oczekiwanie na losowanie…
            </div>
          )}
          {warmup.status === "spinning" && (
            <div
              className="flex items-center gap-2 p-4 text-sm text-muted-foreground"
              data-testid="warmup-spinning"
            >
              <Spinner /> Losowanie trwa…
            </div>
          )}
          {warmup.status === "revealed" && result && (
            <SidebarGroup
              className={cn("gap-4", highlight && "animate-pulse")}
              data-testid="warmup-result"
            >
              {result.description && (
                <p className="text-sm text-muted-foreground">
                  {result.description}
                </p>
              )}
              <div className="flex min-w-0 flex-col gap-4">
                <a
                  className="block w-full truncate text-sm text-muted-foreground underline"
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.url.replace(/^https?:\/\/(www\.)?/i, "")}
                </a>
              </div>
            </SidebarGroup>
          )}
        </SidebarContent>
        {warmup.status === "revealed" &&
          result &&
          isAdmin &&
          shouldWaitForRoomCreation && (
            <SidebarFooter
              className="mt-auto gap-2"
              data-testid="warmup-room-form"
            >
              <Textarea
                aria-label="Link do pokoju"
                placeholder="Wklej link do utworzonego pokoju"
                rows={2}
                className="resize-none"
                value={roomUrl}
                onChange={(event) => setRoomUrl(event.target.value)}
              />
              <Button
                className="w-full"
                disabled={saving || !roomUrl.trim()}
                variant="secondary"
                onClick={() => {
                  setSaving(true);
                  updateWarmupRoomUrl(roomUrl.trim());
                  setTimeout(() => setSaving(false), 500);
                }}
              >
                {saving ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <LinkIcon data-icon="inline-start" />
                )}
                {warmup.sharedRoomUrl ? "Zaktualizuj link" : "Udostępnij link"}
              </Button>
            </SidebarFooter>
          )}
      </Sidebar>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
        <div className="pt-4 mx-4 gap-4 flex flex-row">
          <SidebarTrigger variant="default" />
          <div>
            <h1 className="text-base font-normal">Rozgrzewka</h1>
          </div>
        </div>

        <div className="pointer-events-none flex min-h-0 w-full flex-1 items-center justify-center p-4 pt-6 pb-24">
          <WarmupWheel
            candidates={warmup.candidates}
            status={warmup.status}
            resultId={warmup.result?.id}
            spinEndsAt={warmup.spinEndsAt}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}
