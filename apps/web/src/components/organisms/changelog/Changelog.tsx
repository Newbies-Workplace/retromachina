import { ClapperboardIcon } from "lucide-react";
import { useEffect } from "react";
import { currentVersion } from "@/changelog/releases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/context/user/UserContext.hook";
import {
  getVisibleReleases,
  useChangelogStore,
} from "@/store/useChangelogStore";

export function Changelog() {
  const { user } = useUser();
  const {
    open,
    disabled,
    history,
    previous,
    initialize,
    showHistory,
    setOpen,
    setDisabled,
  } = useChangelogStore();

  useEffect(() => {
    if (user) initialize();
  }, [user, initialize]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-auto bottom-4 left-4 max-h-[calc(100dvh-2rem)] translate-x-0 translate-y-0 gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="relative mx-0 mt-0 flex-row items-center gap-5 border-b px-6 py-7">
          <div
            className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-primary-foreground/60 text-primary-foreground"
            aria-hidden="true"
          >
            <span className="absolute inset-0 animate-spin bg-conic from-transparent to-primary-foreground/40 [animation-duration:4s] motion-reduce:animate-none" />
            <span className="absolute inset-2 rounded-full border-2 border-primary-foreground/60" />
            <span className="absolute inset-x-0 top-1/2 h-px bg-primary-foreground/60" />
            <span className="absolute inset-y-0 left-1/2 w-px bg-primary-foreground/60" />
            <span className="relative z-10 font-mono text-6xl font-bold">
              5
            </span>
          </div>
          <div className="min-w-0 pr-5">
            <DialogTitle className="text-2xl font-bold">Co nowego</DialogTitle>
            <DialogDescription className="mt-2">
              {history
                ? "Archiwum naszych premier."
                : "Nowa wersja. Czas na kolejny seans."}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="max-h-[45dvh] space-y-6 overflow-y-auto px-6 py-5">
          {getVisibleReleases(history, previous).map((release) => (
            <article key={release.version} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  v{release.version}
                </Badge>
                {release.version === currentVersion && <Badge>Premiera</Badge>}
                <time
                  className="ml-auto text-xs text-muted-foreground"
                  dateTime={release.date}
                >
                  {release.date.split("-").reverse().join(".")}
                </time>
              </div>
              <h3 className="font-semibold">{release.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {release.changes.map((change) => (
                  <li key={change} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    {change}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <DialogFooter className="mx-0 mb-0 flex-col gap-4 px-6 py-4 sm:flex-col">
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 space-y-1.5 text-xs text-muted-foreground">
              <label
                htmlFor="changelog-disabled"
                className="flex min-w-0 cursor-pointer items-center gap-2 text-xs text-muted-foreground"
              >
                <Checkbox
                  id="changelog-disabled"
                  checked={disabled}
                  onCheckedChange={(checked) => setDisabled(checked === true)}
                  aria-describedby="changelog-preference-description"
                />
                Nie pokazuj ponownie
              </label>
              <p id="changelog-preference-description" className="pl-6">
                Nowości zawsze znajdziesz w menu.
              </p>
            </div>
            <Button className="shrink-0" onClick={() => setOpen(false)}>
              <ClapperboardIcon />
              Zrozumiano
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            {!history && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground"
                onClick={showHistory}
              >
                Historia zmian
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
