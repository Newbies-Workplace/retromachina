import {
  ArrowRightIcon,
  ExternalLinkIcon,
  LinkIcon,
  SparklesIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WarmupWheel } from "@/components/organisms/warmup_wheel/WarmupWheel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useTeamRole } from "@/hooks/useTeamRole";
import { cn } from "@/lib/utils";

export function WarmupView() {
  const {
    teamId,
    warmup,
    startWarmupDraw,
    updateWarmupRoomUrl,
    completeWarmup,
  } = useRetro();
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
  const activeUrl = warmup.sharedRoomUrl ?? result?.url;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-4 pb-24">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Rozgrzewka</h1>
          <p className="text-muted-foreground">
            Zakręć kołem i zacznijcie spotkanie od krótkiej zabawy.
          </p>
        </div>

        <WarmupWheel
          candidates={warmup.candidates}
          status={warmup.status}
          resultId={warmup.result?.id}
          spinEndsAt={warmup.spinEndsAt}
        />

        {warmup.status === "pending" && isAdmin && (
          <Button
            size="lg"
            variant="secondary"
            onClick={startWarmupDraw}
            data-testid="start-warmup-draw"
          >
            <SparklesIcon data-icon="inline-start" />
            Rozpocznij losowanie
          </Button>
        )}
        {warmup.status === "pending" && !isAdmin && (
          <p className="text-muted-foreground">
            Prowadzący zaraz uruchomi koło…
          </p>
        )}
        {warmup.status === "spinning" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner /> Losowanie trwa…
          </div>
        )}

        {warmup.status === "revealed" && result && (
          <Card
            className={cn(
              "w-full transition-shadow",
              highlight && "animate-pulse ring-4 ring-secondary",
            )}
            data-testid="warmup-result"
          >
            <CardHeader>
              <CardTitle>{result.name}</CardTitle>
              <CardDescription>{result.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <a
                className="truncate text-sm text-muted-foreground underline"
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {result.url}
              </a>
              {isAdmin && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    aria-label="Link do pokoju"
                    placeholder="Wklej link do utworzonego pokoju"
                    type="url"
                    value={roomUrl}
                    onChange={(event) => setRoomUrl(event.target.value)}
                  />
                  <Button
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
                    {warmup.sharedRoomUrl
                      ? "Zaktualizuj link"
                      : "Udostępnij link"}
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  window.open(activeUrl, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLinkIcon data-icon="inline-start" />
                Otwórz rozgrzewkę
              </Button>
              {isAdmin && (
                <Button onClick={completeWarmup}>
                  Przejdź do retrospektywy
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}
