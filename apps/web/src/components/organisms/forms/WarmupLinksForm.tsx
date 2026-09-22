import { PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  WarmupLinkRequest,
  WarmupLinkResponse,
} from "shared/model/warmup/warmup";
import { toast } from "sonner";
import { TeamService } from "@/api/Team.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_FORM: WarmupLinkRequest = { name: "", description: "", url: "" };

export function WarmupLinksForm({ teamId }: { teamId: string }) {
  const [items, setItems] = useState<WarmupLinkResponse[]>([]);
  const [form, setForm] = useState<WarmupLinkRequest>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    TeamService.getWarmups(teamId)
      .then(setItems)
      .catch(() => {
        toast.error("Nie udało się pobrać rozgrzewek");
      });
  }, [teamId]);

  useEffect(refresh, [refresh]);

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error("Nazwa i link są wymagane");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await TeamService.updateWarmup(teamId, editingId, form);
      } else {
        await TeamService.createWarmup(teamId, form);
      }
      reset();
      refresh();
      toast.success("Rozgrzewka została zapisana");
    } catch {
      toast.error("Nie udało się zapisać rozgrzewki");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            className="flex items-center gap-2 rounded-lg border p-2"
            key={item.id}
          >
            <div className="min-w-0 grow">
              <div className="truncate font-medium">{item.name}</div>
              <div className="truncate text-sm text-muted-foreground">
                {item.description || item.url}
              </div>
            </div>
            {item.source === "team" && (
              <>
                <Button
                  aria-label={`Edytuj ${item.name}`}
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setEditingId(item.id);
                    setForm({
                      name: item.name,
                      description: item.description,
                      url: item.url,
                    });
                  }}
                >
                  <PencilIcon />
                </Button>
                <Button
                  aria-label={`Usuń ${item.name}`}
                  size="icon"
                  variant="destructive"
                  onClick={async () => {
                    await TeamService.deleteWarmup(teamId, item.id);
                    refresh();
                  }}
                >
                  <Trash2Icon />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <Input
          aria-label="Nazwa rozgrzewki"
          placeholder="Nazwa rozgrzewki"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Textarea
          aria-label="Opis rozgrzewki"
          placeholder="Opis (opcjonalnie)"
          value={form.description ?? ""}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
        <Input
          aria-label="Link do rozgrzewki"
          placeholder="https://..."
          type="url"
          value={form.url}
          onChange={(event) => setForm({ ...form, url: event.target.value })}
        />
        <div className="flex justify-end gap-2">
          {editingId && (
            <Button variant="outline" onClick={reset}>
              <XIcon data-icon="inline-start" />
              Anuluj
            </Button>
          )}
          <Button disabled={saving} onClick={save}>
            <PlusIcon data-icon="inline-start" />
            {editingId ? "Zapisz zmiany" : "Dodaj rozgrzewkę"}
          </Button>
        </div>
      </div>
    </section>
  );
}
