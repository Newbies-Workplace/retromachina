import type { WarmupLinkResponse } from "shared/model/warmup/warmup";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  warmups: WarmupLinkResponse[];
  warmupChoice: string;
  onChange: (choice: string) => void;
}
export function WarmupChooser({ warmups, warmupChoice, onChange }: Props) {
  const isWarmupSelected = warmupChoice.startsWith("selected:");
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium">Rozgrzewka</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          type="button"
          data-testid="warmup-choice-none"
          variant={warmupChoice === "none" ? "default" : "outline"}
          aria-pressed={warmupChoice === "none"}
          className="h-full min-h-16 flex-col items-start gap-1 whitespace-normal p-3 text-left"
          onClick={() => onChange("none")}
        >
          <span className="font-medium">Bez rozgrzewki</span>
          <span className="text-xs opacity-75">Pomiń rozgrzewkę</span>
        </Button>

        <Button
          type="button"
          data-testid="warmup-choice-random"
          variant={warmupChoice === "random" ? "default" : "outline"}
          aria-pressed={warmupChoice === "random"}
          className="h-full min-h-16 flex-col items-start gap-1 whitespace-normal p-3 text-left"
          onClick={() => onChange("random")}
        >
          <span className="font-medium">Losuj po starcie</span>
          <span className="text-xs opacity-75">
            Wylosuj rozgrzewkę po rozpoczęciu retro
          </span>
        </Button>

        <div
          data-selected={isWarmupSelected}
          className={cn(
            "group relative flex min-h-16 rounded-lg border shadow-sm transition-colors hover:shadow-none",
            isWarmupSelected
              ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80"
              : "border-border bg-background hover:bg-muted hover:text-foreground",
          )}
        >
          <Select
            value={isWarmupSelected ? warmupChoice : null}
            onValueChange={(value) => {
              if (value === "empty") return;
              onChange(value ?? "none");
            }}
            itemToStringLabel={(value) => {
              if (!value) return "";
              const id = value.replace("selected:", "");
              return warmups.find((item) => item.id === id)?.name ?? value;
            }}
          >
            <SelectTrigger
              id="warmup-select"
              className="relative h-full min-h-16 w-full flex-col items-start justify-center gap-2 border-0 bg-transparent p-3 pr-8 text-left text-inherit shadow-none hover:bg-transparent focus-visible:ring-0 [&>svg]:absolute [&>svg]:top-3 [&>svg]:right-3"
              data-testid="warmup-select"
              aria-label="Wybierz rozgrzewkę"
            >
              <span className="flex w-full flex-col gap-2">
                <span className="text-sm font-medium">Wybierz rozgrzewkę</span>
                <SelectValue
                  className="min-h-4 w-full flex-none"
                  placeholder="-"
                />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {warmups.length === 0 ? (
                  <SelectItem value="empty">
                    Brak dostępnych rozgrzewek
                  </SelectItem>
                ) : (
                  warmups.map((warmup) => (
                    <SelectItem key={warmup.id} value={`selected:${warmup.id}`}>
                      {warmup.name}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
