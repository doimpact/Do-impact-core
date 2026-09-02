import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Eye, RefreshCw, Save, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OwnerSelect } from "@/components/owner-select";
import { PlaybookForm } from "@/components/actions/playbook/playbook-form";
import {
  buildPlaybook,
  goalByKey,
  horizonLabel,
  weightLabel,
  type PlaybookInputs,
} from "@/lib/decision-playbook";
import {
  usePlaybook,
  usePlaybookItems,
  usePushToActions,
  useReplaceItems,
  useUpdateItem,
  useUpdatePlaybook,
  type NewItem,
  type PlaybookItem,
} from "@/hooks/use-playbooks";

export const Route = createFileRoute("/_authenticated/actions/playbook/$id")({
  head: () => ({
    meta: [
      { title: "Playbook worksheet — DO.Impact" },
      { name: "description", content: "Recommended next actions and assumptions to verify for this goal." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PlaybookWorksheetPage,
});

function PlaybookWorksheetPage() {
  const { id } = Route.useParams();
  const { data: sheet, isLoading } = usePlaybook(id);
  const { data: items = [] } = usePlaybookItems(id);
  const updateSheet = useUpdatePlaybook();
  const replaceItems = useReplaceItems(id);
  const updateItem = useUpdateItem(id);
  const push = usePushToActions(id);

  const [values, setValues] = useState<PlaybookInputs>({});
  useEffect(() => {
    if (sheet) setValues(sheet.inputs ?? {});
  }, [sheet?.id, sheet?.updated_at]);

  const goal = sheet ? goalByKey(sheet.goal_key) : undefined;
  const fresh = useMemo(() => (sheet ? buildPlaybook(sheet.goal_key, values) : null), [sheet?.goal_key, values]);

  const actions = items.filter((i) => i.kind === "action");
  const assumptions = items.filter((i) => i.kind === "assumption");
  const watch = items.filter((i) => i.kind === "watch");
  const dirty = sheet ? JSON.stringify(values) !== JSON.stringify(sheet.inputs ?? {}) : false;

  async function regenerate() {
    if (!sheet || !fresh) return;
    const next: NewItem[] = [
      ...fresh.actions.map((a, i) => ({
        kind: "action" as const, rule_key: a.ruleKey, text: a.text, rationale: a.rationale,
        horizon: a.horizon, impact: a.impact, effort: a.effort, sort_order: i,
      })),
      ...fresh.assumptions.map((a, i) => ({
        kind: "assumption" as const, rule_key: a.ruleKey, text: a.text, rationale: a.test,
        horizon: null, impact: null, effort: a.effort, sort_order: 100 + i,
      })),
      ...fresh.watch.map((w, i) => ({
        kind: "watch" as const, rule_key: null, text: w, rationale: null,
        horizon: null, impact: null, effort: null, sort_order: 200 + i,
      })),
    ];
    try {
      await updateSheet.mutateAsync({ id: sheet.id, patch: { inputs: values } });
      await replaceItems.mutateAsync(next);
      toast.success("Recommendations refreshed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not refresh the recommendations");
    }
  }

  async function pushAccepted() {
    if (!sheet) return;
    const toPush = actions.filter((a) => a.accepted && !a.pushed_action_id);
    if (!toPush.length) {
      toast.info("Tick the actions you want to push first.");
      return;
    }
    try {
      const n = await push.mutateAsync({ items: toPush, objectiveId: sheet.objective_id });
      toast.success(`${n} action${n === 1 ? "" : "s"} added to the tracker`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not push the actions");
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!sheet || !goal) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">This playbook no longer exists.</p>
        <Button asChild variant="outline"><Link to="/actions/playbook">Back to playbooks</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to="/actions/playbook"><ArrowLeft className="mr-1 h-4 w-4" /> Playbooks</Link>
          </Button>
          <h1 className="text-2xl font-semibold">{sheet.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{goal.label}</Badge>
            {sheet.archived_at && <Badge variant="outline">Archived</Badge>}
          </div>
          {sheet.notes && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{sheet.notes}</p>}
        </div>
        <Button onClick={() => void pushAccepted()} disabled={push.isPending}>
          <ArrowUpRight className="mr-1 h-4 w-4" />
          {push.isPending ? "Pushing…" : "Push accepted to Actions"}
        </Button>
      </div>

      <Tabs defaultValue="worksheet">
        <TabsList>
          <TabsTrigger value="worksheet">Worksheet</TabsTrigger>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
        </TabsList>

        <TabsContent value="worksheet" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4" /> Recommended next actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {actions.length === 0 && (
                <p className="text-sm text-muted-foreground">No actions. Update the inputs and refresh.</p>
              )}
              {actions.map((item) => (
                <ActionRow key={item.id} item={item} onPatch={(patch) => updateItem.mutate({ id: item.id, patch })} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TriangleAlert className="h-4 w-4" /> Assumptions to verify
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assumptions.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing to verify — every input needed was provided.</p>
              )}
              {assumptions.map((a) => (
                <div key={a.id} className="rounded-md border p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={a.accepted}
                      onCheckedChange={(v) => updateItem.mutate({ id: a.id, patch: { accepted: v === true } })}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{a.text}</p>
                      {a.rationale && <p className="mt-1 text-xs text-muted-foreground">How to test: {a.rationale}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {watch.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" /> Watch-outs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {watch.map((w) => <li key={w.id}>{w.text}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inputs" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Data inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PlaybookForm goal={goal} values={values} onChange={setValues} />
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => void regenerate()} disabled={replaceItems.isPending || updateSheet.isPending}>
                  <RefreshCw className="mr-1 h-4 w-4" /> Save and refresh recommendations
                </Button>
                {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                Refreshing rewrites the recommendations from the rules. Lines already pushed to the tracker are kept.
              </p>
            </CardContent>
          </Card>

          {fresh && fresh.missingInputs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Save className="h-4 w-4" /> Still missing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {fresh.missingInputs.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActionRow({ item, onPatch }: { item: PlaybookItem; onPatch: (patch: Partial<PlaybookItem>) => void }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start gap-2">
        <Checkbox
          checked={item.accepted}
          disabled={!!item.pushed_action_id}
          onCheckedChange={(v) => onPatch({ accepted: v === true })}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{item.text}</p>
            {item.horizon && <Badge variant="outline">{horizonLabel(item.horizon)}</Badge>}
            {item.impact && <Badge variant="outline">Impact {weightLabel(item.impact)}</Badge>}
            {item.effort && <Badge variant="outline">Effort {weightLabel(item.effort)}</Badge>}
            {item.pushed_action_id && <Badge>In tracker</Badge>}
          </div>
          {item.rationale && <p className="text-xs text-muted-foreground">Why: {item.rationale}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Owner</Label>
              <OwnerSelect value={item.owner_id} onChange={(v) => onPatch({ owner_id: v })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Due date</Label>
              <Input
                type="date"
                value={item.due_date ?? ""}
                onChange={(e) => onPatch({ due_date: e.target.value || null })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
