import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Archive, ArchiveRestore, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { TOOL_BY_ID, type ToolId } from "@/lib/problem-tools";

export type ToolRecord = { id: string; title: string; archived_at?: string | null };

export function ToolShell({
  toolId,
  records,
  value,
  onSelect,
  onCreate,
  onDelete,
  onArchiveChange,
  showArchived,
  onShowArchivedChange,
  children,
}: {
  toolId: ToolId;
  records: ToolRecord[];
  value: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (title: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onArchiveChange?: (id: string, archived: boolean) => void | Promise<void>;
  showArchived?: boolean;
  onShowArchivedChange?: (v: boolean) => void;
  children: ReactNode;
}) {
  const tool = TOOL_BY_ID[toolId];
  const [newTitle, setNewTitle] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentRecord = records.find((r) => r.id === value) ?? null;
  const isArchived = !!currentRecord?.archived_at;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        {toolId === "mro" ? (
          <Link to="/actions/problem-solver"><ArrowLeft className="mr-1.5 h-4 w-4" /> Problem Solver</Link>
        ) : (
          <Link to="/actions/problem-solver"><ArrowLeft className="mr-1.5 h-4 w-4" /> All tools</Link>
        )}
      </Button>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                {tool.name}
                <Badge variant="secondary" className={tool.tone}>{tool.short}</Badge>
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{tool.mechanism}</p>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground"><span className="font-medium">Aerospace example:</span> {tool.example}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {tool.links.map((l) => (
                <Button key={l.to} asChild variant="outline" size="sm">
                  <Link to={l.to}>{l.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Select value={value ?? ""} onValueChange={(v) => onSelect(v || null)}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder={records.length ? "Select…" : "Nothing created yet"} />
              </SelectTrigger>
              <SelectContent>
                {records.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                    {r.archived_at ? " · archived" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="w-[220px]"
              placeholder="New title…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && newTitle.trim()) {
                  await onCreate(newTitle.trim());
                  setNewTitle("");
                }
              }}
            />
            <Button
              disabled={!newTitle.trim()}
              onClick={async () => {
                await onCreate(newTitle.trim());
                setNewTitle("");
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create
            </Button>

            {value && onArchiveChange && (
              <Button variant="outline" onClick={() => onArchiveChange(value, !isArchived)}>
                {isArchived ? <ArchiveRestore className="mr-1.5 h-4 w-4" /> : <Archive className="mr-1.5 h-4 w-4" />}
                {isArchived ? "Restore" : "Archive"}
              </Button>
            )}

            {value && (
              <Button variant="ghost" className="text-destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {onShowArchivedChange && (
              <div className="ml-auto flex items-center gap-2">
                <Switch id="show-archived" checked={!!showArchived} onCheckedChange={onShowArchivedChange} />
                <Label htmlFor="show-archived" className="text-xs text-muted-foreground">Show archived</Label>
              </div>
            )}
          </div>

          {isArchived && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
              This record is archived. Restore it to bring it back into the active list.
            </p>
          )}
        </CardContent>
      </Card>

      {value ? children : (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          Create or select a record above to start working.
        </CardContent></Card>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentRecord?.title ? `“${currentRecord.title}” ` : "This record "}
              and everything under it will be permanently removed. Archive it instead if you only want it out of the way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!value) return;
                await onDelete(value);
                onSelect(null);
                setConfirmOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
