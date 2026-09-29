import { LinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { WarmupState } from "shared/model/warmup/warmup";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function getSidebarTitle(warmup: WarmupState) {
  const selected = warmup.candidates.find(
    (candidate) => candidate.id === warmup.selectedWarmupId,
  );
  if (warmup.status === "revealed")
    return warmup.result?.name ?? "Nie wybrano rozgrzewki";
  if (warmup.status === "pending")
    return selected?.name ?? "Nie wybrano rozgrzewki";
  return "Wybór rozgrzewki";
}
interface Props {
  warmup: WarmupState;
  isAdmin: boolean;
  highlight?: boolean;
  onShare: (url: string) => void;
}
export function WarmupSidebar({
  warmup,
  isAdmin,
  highlight = false,
  onShare,
}: Props) {
  const result = warmup.result;
  const shouldWaitForRoomCreation = result
    ? (result.shouldWaitForRoomCreation ?? result.id !== "default-giphy")
    : true;
  const sidebarTitle = getSidebarTitle(warmup);
  return (
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
          <WarmupRoomForm
            sharedRoomUrl={warmup.sharedRoomUrl}
            onShare={onShare}
          />
        )}
    </Sidebar>
  );
}
function WarmupRoomForm({
  sharedRoomUrl,
  onShare,
}: {
  sharedRoomUrl: string | null;
  onShare: (url: string) => void;
}) {
  const [roomUrl, setRoomUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (saveTimeout.current !== null) clearTimeout(saveTimeout.current);
    },
    [],
  );
  return (
    <SidebarFooter className="mt-auto gap-2" data-testid="warmup-room-form">
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
          onShare(roomUrl.trim());
          saveTimeout.current = setTimeout(() => setSaving(false), 500);
        }}
      >
        {saving ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <LinkIcon data-icon="inline-start" />
        )}
        {sharedRoomUrl ? "Zaktualizuj link" : "Udostępnij link"}
      </Button>
    </SidebarFooter>
  );
}
