import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GitBranch, Pin, PinOff } from "lucide-react";
import {
  LAYERS,
  LINK_TYPES,
  layerMeta,
  linkMeta,
  type EnLink,
  type EnNode,
} from "@/lib/enterprise-network";

export function NodeInspector({
  node,
  nodes,
  links,
  linkFrom,
  onPatchNode,
  onDeleteNode,
  onPatchLink,
  onDeleteLink,
  onStartLink,
  readOnly,
}: {
  node: EnNode;
  nodes: EnNode[];
  links: EnLink[];
  linkFrom: string | null;
  onPatchNode: (patch: Record<string, unknown>) => void;
  onDeleteNode: () => void;
  onPatchLink: (id: string, patch: Record<string, unknown>) => void;
  onDeleteLink: (id: string) => void;
  onStartLink: () => void;
  readOnly?: boolean;
}) {
  const labelOf = (id: string) => nodes.find((n) => n.id === id)?.label ?? "?";
  const outgoing = links.filter((l) => l.from_node === node.id);
  const incoming = links.filter((l) => l.to_node === node.id);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background" style={{ backgroundColor: layerMeta(node.layer).ring }}>
            {layerMeta(node.layer).short}
          </span>
          <h3 className="mt-1.5 truncate font-semibold">{node.label}</h3>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={readOnly}
          onClick={() => onPatchNode({ pinned: !node.pinned })}
          aria-label={node.pinned ? "Unpin position" : "Pin position"}
        >
          {node.pinned ? <Pin className="h-4 w-4 text-primary" /> : <PinOff className="h-4 w-4" />}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input defaultValue={node.label} disabled={readOnly} onBlur={(e) => e.target.value !== node.label && onPatchNode({ label: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Layer</Label>
          <Select value={node.layer} disabled={readOnly} onValueChange={(v) => onPatchNode({ layer: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LAYERS.map((l) => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Health</Label>
          <Select value={node.health ?? "none"} disabled={readOnly} onValueChange={(v) => onPatchNode({ health: v === "none" ? null : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not set</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Owner</Label>
        <Input
          defaultValue={node.owner_label ?? ""}
          placeholder="Who is accountable?"
          disabled={readOnly}
          onBlur={(e) => onPatchNode({ owner_label: e.target.value || null })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Criticality — {Math.round(Number(node.criticality) * 100)}%</Label>
        <Slider
          value={[Number(node.criticality)]}
          min={0}
          max={1}
          step={0.05}
          disabled={readOnly}
          onValueCommit={([v]) => onPatchNode({ criticality: v ?? 0.5 })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea rows={2} defaultValue={node.notes ?? ""} disabled={readOnly} onBlur={(e) => onPatchNode({ notes: e.target.value || null })} />
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={linkFrom === node.id ? "default" : "outline"} disabled={readOnly} onClick={onStartLink} className="flex-1">
          <GitBranch className="mr-1.5 h-4 w-4" /> {linkFrom === node.id ? "Pick a target…" : "Depend from here"}
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={readOnly} onClick={onDeleteNode}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <LinkList title="Feeds into" rows={outgoing} labelOf={(l) => labelOf(l.to_node)} {...{ onPatchLink, onDeleteLink, readOnly }} />
      <LinkList title="Depends on" rows={incoming} labelOf={(l) => labelOf(l.from_node)} {...{ onPatchLink, onDeleteLink, readOnly }} />
    </div>
  );
}

function LinkList({
  title,
  rows,
  labelOf,
  onPatchLink,
  onDeleteLink,
  readOnly,
}: {
  title: string;
  rows: EnLink[];
  labelOf: (l: EnLink) => string;
  onPatchLink: (id: string, patch: Record<string, unknown>) => void;
  onDeleteLink: (id: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-xs font-medium text-muted-foreground">
        {title} ({rows.length})
      </p>
      {rows.map((l) => (
        <div key={l.id} className="rounded-lg border border-border p-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: linkMeta(l.link_type).color }} />
            <span className="flex-1 truncate text-sm">{labelOf(l)}</span>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={readOnly} onClick={() => onDeleteLink(l.id)} aria-label="Remove dependency">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Select value={l.link_type} disabled={readOnly} onValueChange={(v) => onPatchLink(l.id, { link_type: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={l.polarity} disabled={readOnly} onValueChange={(v) => onPatchLink(l.id, { polarity: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="S">Same direction (+)</SelectItem>
                <SelectItem value="O">Opposite (−)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Strength {l.strength.toFixed(2)}</p>
              <Slider value={[l.strength]} min={0.05} max={1} step={0.05} disabled={readOnly} onValueCommit={([v]) => onPatchLink(l.id, { strength: v })} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Lag {l.lag_weeks}w</p>
              <Slider value={[l.lag_weeks]} min={0} max={26} step={1} disabled={readOnly} onValueCommit={([v]) => onPatchLink(l.id, { lag_weeks: v })} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
