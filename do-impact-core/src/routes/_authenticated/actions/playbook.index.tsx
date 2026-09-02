import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ClipboardCheck, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { confirmDialog } from "@/components/confirm-dialog";
import { PlaybookForm } from "@/components/actions/playbook/playbook-form";
import { GOALS, buildPlaybook, goalByKey, horizonLabel, type PlaybookInputs } from "@/lib/decision-playbook";
import {
  useCreatePlaybook,
  useDeletePlaybook,
  usePlaybooks,
  useUpdatePlaybook,
  type NewItem,
  type PlaybookWorksheet,
} from "@/hooks/use-playbooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/actions/playbook/")({
  head: () => ({
    meta: [
      { title: "Decision Playbook — DO.Impact" },
      {
        name: "description",
        content: "Turn a goal and a handful of numbers into recommended next actions and the assumptions to verify first.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PlaybookHub,
});

const NONE = "__none__";

export function useObjectiveOptions() {
  return useQuery({
    queryKey: ["playbook-objective-options"],
    queryFn: async () => {
      const [obj, hoshin] = await Promise.all([
        supabase.from("strategic_objectives").select("id,title").is("archived_at", null).order("title"),
        supabase.from("hoshin_items").select("id,title,kind").is("archived_at", null).order("title"),
      ]);
      if (obj.error) throw obj.error;
      if (hoshin.error) throw hoshin.error;
      return {
        objectives: (obj.data ?? []) as { id: string; title: string }[],
        hoshin: (hoshin.data ?? []) as { id: string; title: string; kind: string }[],
      };
    },
  });
}

function PlaybookHub() {
  const { data: sheets = [], isLoading } = usePlaybooks();
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const update = useUpdatePlaybook();
  const remove = useDeletePlaybook();

  const archived = sheets.filter((s) => s.archived_at).length;
  const visible = sheets.filter((s) => (showArchived ? true : !s.archived_at));

  async function toggleArchive(sheet: PlaybookWorksheet) {
    const archiving = !sheet.archived_at;
    try {
      await update.mutateAsync({ id: sheet.id, patch: { archived_at: archiving ? new Date().toISOString() : null } });
      toast.success(archiving ? "Playbook archived" : "Playbook restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the playbook");
    }
  }

  async function del(sheet: PlaybookWorksheet) {
    const ok = await confirmDialog({
      title: "Delete this playbook?",
      description: `"${sheet.title}" and its recommendations will be permanently removed. Actions already pushed to the tracker stay there.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(sheet.id);
      toast.success("Playbook deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the playbook");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Decision Playbook</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Pick a goal, enter what you know, and get a ranked set of next actions with the assumptions behind them.
            The recommendations are rule-based — the same inputs always give the same answer, and every line tells you
            which rule fired.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> New playbook
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch id="pb-archived" checked={showArchived} onCheckedChange={setShowArchived} />
          <Label htmlFor="pb-archived" className="text-sm">Show archived</Label>
        </div>
        <span className="text-sm text-muted-foreground">
          {sheets.length - archived} active · {archived} archived
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ClipboardCheck className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No playbooks yet. Start one from a goal — it takes about two minutes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => {
            const goal = goalByKey(s.goal_key);
            return (
              <div key={s.id} className={cn("rounded-lg border bg-card p-4", s.archived_at && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <Link to="/actions/playbook/$id" params={{ id: s.id }} className="font-semibold hover:underline">
                    {s.title}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => void toggleArchive(s)}>
                        {s.archived_at ? (
                          <><ArchiveRestore className="mr-2 h-4 w-4" /> Restore</>
                        ) : (
                          <><Archive className="mr-2 h-4 w-4" /> Archive</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => void del(s)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{goal?.label ?? s.goal_key}</Badge>
                  {s.archived_at && <Badge variant="outline">Archived</Badge>}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Created {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <NewPlaybookDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function NewPlaybookDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const create = useCreatePlaybook();
  const { data: links } = useObjectiveOptions();
  const [goalKey, setGoalKey] = useState(GOALS[0].key);
  const [title, setTitle] = useState("");
  const [objectiveId, setObjectiveId] = useState<string>(NONE);
  const [hoshinId, setHoshinId] = useState<string>(NONE);
  const [notes, setNotes] = useState("");
  const [values, setValues] = useState<PlaybookInputs>({});

  const goal = goalByKey(goalKey)!;
  const preview = useMemo(() => buildPlaybook(goalKey, values), [goalKey, values]);

  function reset() {
    setGoalKey(GOALS[0].key);
    setTitle("");
    setObjectiveId(NONE);
    setHoshinId(NONE);
    setNotes("");
    setValues({});
  }

  async function save() {
    if (!preview) return;
    const items: NewItem[] = [
      ...preview.actions.map((a, i) => ({
        kind: "action" as const,
        rule_key: a.ruleKey,
        text: a.text,
        rationale: a.rationale,
        horizon: a.horizon,
        impact: a.impact,
        effort: a.effort,
        sort_order: i,
      })),
      ...preview.assumptions.map((a, i) => ({
        kind: "assumption" as const,
        rule_key: a.ruleKey,
        text: a.text,
        rationale: a.test,
        horizon: null,
        impact: null,
        effort: a.effort,
        sort_order: 100 + i,
      })),
      ...preview.watch.map((w, i) => ({
        kind: "watch" as const,
        rule_key: null,
        text: w,
        rationale: null,
        horizon: null,
        impact: null,
        effort: null,
        sort_order: 200 + i,
      })),
    ];
    try {
      const id = await create.mutateAsync({
        goal_key: goalKey,
        title: title.trim() || `${goal.label} — ${new Date().toLocaleDateString()}`,
        objective_id: objectiveId === NONE ? null : objectiveId,
        hoshin_item_id: hoshinId === NONE ? null : hoshinId,
        inputs: values,
        notes: notes.trim() || null,
        items,
      });
      toast.success("Playbook created");
      onOpenChange(false);
      reset();
      void navigate({ to: "/actions/playbook/$id", params: { id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the playbook");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New decision playbook</DialogTitle>
          <DialogDescription>
            Choose the goal and fill in what you know. Blanks are fine — missing data becomes a recommendation to go
            and measure it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Goal</Label>
              <Select value={goalKey} onValueChange={(v) => { setGoalKey(v); setValues({}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-muted-foreground">{goal.blurb}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${goal.label} — ${new Date().toLocaleDateString()}`} />
            </div>
            <div className="space-y-1.5">
              <Label>Link to a strategic objective (optional)</Label>
              <Select value={objectiveId} onValueChange={setObjectiveId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {(links?.objectives ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Pushed actions are attached to this objective.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Link to a Hoshin item (optional)</Label>
              <Select value={hoshinId} onValueChange={setHoshinId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {(links?.hoshin ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Data inputs</h3>
            <PlaybookForm goal={goal} values={values} onChange={setValues} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context, constraints, who asked for this." />
          </div>

          <div className="rounded-lg border bg-muted/40 p-3">
            <h3 className="text-sm font-semibold">Preview — {preview?.actions.length ?? 0} recommended actions</h3>
            <ul className="mt-2 space-y-1.5">
              {(preview?.actions ?? []).slice(0, 5).map((a) => (
                <li key={a.ruleKey} className="text-sm">
                  <span className="font-medium">{a.text}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{horizonLabel(a.horizon)}</span>
                </li>
              ))}
              {(preview?.actions.length ?? 0) === 0 && (
                <li className="text-sm text-muted-foreground">
                  Nothing fires yet — enter a few numbers above to see the recommendations.
                </li>
              )}
              {(preview?.actions.length ?? 0) > 5 && (
                <li className="text-xs text-muted-foreground">+ {preview!.actions.length - 5} more once saved.</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
          <Button onClick={() => void save()} disabled={create.isPending || (preview?.actions.length ?? 0) === 0}>
            {create.isPending ? "Saving…" : "Create playbook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
