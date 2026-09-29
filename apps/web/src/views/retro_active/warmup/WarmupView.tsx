import { useEffect, useRef, useState } from "react";
import { WarmupWheel } from "@/components/organisms/warmup_wheel/WarmupWheel";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useTeamRole } from "@/hooks/useTeamRole";
import { WarmupSidebar } from "./WarmupSidebar";

export function WarmupView() {
  const { teamId, warmup, updateWarmupRoomUrl } = useRetro();
  const { user } = useUser();
  const { isAdmin } = useTeamRole(teamId ?? "");
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

  return (
    <SidebarProvider className="h-full min-h-0">
      <WarmupSidebar
        warmup={warmup}
        isAdmin={isAdmin}
        highlight={highlight}
        onShare={updateWarmupRoomUrl}
      />

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
