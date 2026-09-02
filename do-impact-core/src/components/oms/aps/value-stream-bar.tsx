import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";
import { assertWrote } from "@/lib/write-guard";
import type { ApsValueStream } from "@/lib/aps";

type Props = {
  companyId: string;
  streams: ApsValueStream[];
  activeId: string | null;
  onSelect: (id: string) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
};

export function ValueStreamBar({ companyId, streams, activeId, onSelect, showArchived, onToggleArchived }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApsValueStream | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["aps-value-streams"] });
  };

  const save = useMutation({
    mutationFn: async (v: { id?: string; name: string; code: string; description: string }) => {
      if (!v.name.trim()) throw new Error("Give the value stream a name.");
      if (v.id) {
        const { data, error } = await supabase
          .from("aps_value_streams")
          .update({ name: v.name.trim(), code: v.code.trim() || null, description: v.description.trim() || null })
          .eq("id", v.id)
          .select("id");
        if (error) throw error;
        assertWrote(data, "edit");
        return v.id;
      }
      const { data, error } = await supabase
        .from("aps_value_streams")
        .insert({
          company_id: companyId,
          name: v.name.trim(),
          code: v.code.trim() || null,
          description: v.description.trim() || null,
          sort_order: streams.length,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      invalidate();
      onSelect(id);
      setOpen(false);
      toast.success(editing ? "Value stream updated" : "Value stream created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setArchived = useMutation({
    mutationFn: async (v: { id: string; archived: boolean }) => {
      const { data, error } = await supabase
        .from("aps_value_streams")
        .update({ archived_at: v.archived ? new Date().toISOString() : null })
        .eq("id", v.id)
        .select("id");
      if (error) throw error;
      assertWrote(data, v.archived ? "archive" : "restore");
    },
    onSuccess: (_d, v) => {
      invalidate();
      toast.success(v.archived ? "Value stream archived" : "Value stream restored");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (v: { id: string; dir: -1 | 1 }) => {
      const ordered = [...streams].sort((a, b) => a.sort_order - b.sort_order);
      const i = ordered.findIndex((s) => s.id === v.id);
      const j = i + v.dir;
      if (i < 0 || j < 0 || j >= ordered.length) return;
      const a = ordered[i];
      const b = ordered[j];
      const { data, error } = await supabase
        .from("aps_value_streams")
        .upsert([
          { id: a.id, company_id: companyId, name: a.name, sort_order: b.sort_order },
          { id: b.id, company_id: companyId, name: b.name, sort_order: a.sort_order },
        ])
        .select("id");
      if (error) throw error;
      assertWrote(data, "reorder");
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("aps_value_streams").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Value stream deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const askDelete = async (s: ApsValueStream) => {
    const ok = await confirmDialog({
      title: `Delete “${s.name}”?`,
      description:
        "This permanently removes the value stream together with its work centers, work orders, operations, component requirements, tooling and what-if scenarios. Archive instead if you only want to hide it.",
      confirmLabel: "Delete value stream",
      destructive: true,
    });
    if (ok) remove.mutate(s.id);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", code: "", description: "" });
    setOpen(true);
  };
  const openEdit = (s: ApsValueStream) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code ?? "", description: s.description ?? "" });
    setOpen(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[...streams]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => (
          <div
            key={s.id}
            className={`flex items-center rounded-md border ${
              s.id === activeId ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            <button className="px-3 py-1.5 text-sm font-medium" onClick={() => onSelect(s.id)}>
              {s.name}
              {s.code && <span className="ml-1.5 opacity-70">({s.code})</span>}
              {s.archived_at && <span className="ml-2 opacity-70">(archived)</span>}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-1.5 py-1.5 opacity-70 hover:opacity-100" aria-label={`Actions for ${s.name}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(s)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => reorder.mutate({ id: s.id, dir: -1 })}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Move left
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => reorder.mutate({ id: s.id, dir: 1 })}>
                  <ArrowRight className="mr-2 h-4 w-4" /> Move right
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setArchived.mutate({ id: s.id, archived: !s.archived_at })}>
                  {s.archived_at ? (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" /> Archive
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => void askDelete(s)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

      <Button size="sm" variant="outline" onClick={openNew}>
        <Plus className="mr-1 h-4 w-4" /> Value stream
      </Button>
      <Button size="sm" variant="ghost" onClick={onToggleArchived}>
        {showArchived ? "Hide archived" : "Show archived"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit value stream" : "New value stream"}</DialogTitle>
            <DialogDescription>
              A value stream is an area of the shop — its work centers, work orders and scenarios are scheduled together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="vs-name">Name</Label>
              <Input
                id="vs-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Structures machining"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vs-code">Code</Label>
              <Input id="vs-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VS-01" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vs-desc">Description</Label>
              <Textarea
                id="vs-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Scope, product families, shift pattern…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate({ id: editing?.id, ...form })} disabled={save.isPending}>
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
