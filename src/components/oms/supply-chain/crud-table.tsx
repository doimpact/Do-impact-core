import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { scClient, type ScRow } from "@/lib/supply-chain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, Search } from "lucide-react";

export type Option = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select" | "boolean";
  options?: Option[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  defaultValue?: unknown;
  inTable?: boolean;
  render?: (row: ScRow) => React.ReactNode;
  full?: boolean;
};

export type CrudTableProps = {
  table: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  /** column to order by (ascending) */
  orderBy?: string;
  /** equality filters applied to reads and applied to new rows */
  scope?: Record<string, string>;
  searchKeys?: string[];
  emptyHint?: string;
  readOnly?: boolean;
  extraActions?: React.ReactNode;
  queryKeyExtra?: unknown[];
  onChanged?: () => void;
};

function blankDraft(fields: FieldDef[]): ScRow {
  const d: ScRow = {};
  for (const f of fields) {
    d[f.name] = f.defaultValue !== undefined ? f.defaultValue : f.type === "boolean" ? false : "";
  }
  return d;
}

export function CrudTable(props: CrudTableProps) {
  const {
    table, title, description, fields, orderBy = "created_at", scope,
    searchKeys, emptyHint, readOnly, extraActions, queryKeyExtra = [], onChanged,
  } = props;
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ScRow | null>(null);
  const [draft, setDraft] = useState<ScRow>(() => blankDraft(fields));
  const [open, setOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<ScRow | null>(null);

  const key = ["sc", table, scope ?? {}, ...queryKeyExtra];

  const listQ = useQuery({
    queryKey: key,
    queryFn: async () => {
      let q = scClient.from(table).select("*");
      for (const [k, v] of Object.entries(scope ?? {})) q = q.eq(k, v);
      const { data, error } = await q.order(orderBy, { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sc", table] });
    onChanged?.();
  };

  const save = useMutation({
    mutationFn: async (v: ScRow) => {
      const payload: ScRow = { ...scope };
      for (const f of fields) {
        let val = v[f.name];
        if (val === "") val = null;
        if (f.type === "number" && val !== null && val !== undefined) val = Number(val);
        payload[f.name] = val;
      }
      if (editing?.id) {
        const { error } = await scClient.from(table).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await scClient.from(table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { invalidate(); setOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const archive = useMutation({
    mutationFn: async (row: ScRow) => {
      const { error } = await scClient.from(table)
        .update({ archived_at: row.archived_at ? null : new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message || "Could not update"),
  });

  const remove = useMutation({
    mutationFn: async (row: ScRow) => {
      const { error } = await scClient.from(table).delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setDeleteRow(null); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message || "Could not delete"),
  });

  const hasArchive = fields.length > 0; // all sc tables except scores/gates carry archived_at
  const rows = useMemo(() => {
    let list = listQ.data ?? [];
    if (!showArchived) list = list.filter((r) => !r.archived_at);
    const term = search.trim().toLowerCase();
    if (term) {
      const keys = searchKeys ?? fields.filter((f) => (f.type ?? "text") === "text").map((f) => f.name);
      list = list.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(term)));
    }
    return list;
  }, [listQ.data, showArchived, search, searchKeys, fields]);

  const tableFields = fields.filter((f) => f.inTable !== false);

  const startAdd = () => { setEditing(null); setDraft(blankDraft(fields)); setOpen(true); };
  const startEdit = (row: ScRow) => {
    const d: ScRow = {};
    for (const f of fields) d[f.name] = row[f.name] ?? (f.type === "boolean" ? false : "");
    setEditing(row); setDraft(d); setOpen(true);
  };

  const cell = (f: FieldDef, row: ScRow) => {
    if (f.render) return f.render(row);
    const v = row[f.name];
    if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
    if (f.type === "boolean") return v ? "Yes" : "No";
    if (f.type === "select") return f.options?.find((o) => o.value === String(v))?.label ?? String(v);
    if (f.type === "number") return <span className="tabular-nums">{Number(v).toLocaleString()}</span>;
    return String(v);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground max-w-3xl">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="h-9 w-44 pl-8" />
          </div>
          {hasArchive && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={showArchived} onCheckedChange={setShowArchived} /> Archived
            </label>
          )}
          <Button size="sm" onClick={startAdd} disabled={readOnly}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {tableFields.map((f) => (
                <th key={f.name} className="px-3 py-2 text-left font-medium">{f.label}</th>
              ))}
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                {tableFields.map((f) => (
                  <td key={f.name} className="px-3 py-2 align-top">
                    <div className="flex items-center gap-2">
                      {cell(f, row)}
                      {f === tableFields[0] && row.archived_at && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                    </div>
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(row)} disabled={readOnly}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => archive.mutate(row)} disabled={readOnly}>
                        {row.archived_at
                          ? <><ArchiveRestore className="mr-2 h-4 w-4" /> Restore</>
                          : <><Archive className="mr-2 h-4 w-4" /> Archive</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteRow(row)} disabled={readOnly}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={tableFields.length + 1} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {emptyHint ?? "Nothing here yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Edit — ${title}` : `Add — ${title}`}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Label className="text-xs">{f.label}{f.required ? " *" : ""}</Label>
                {f.type === "textarea" ? (
                  <Textarea rows={3} value={String(draft[f.name] ?? "")} placeholder={f.placeholder}
                    onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })} />
                ) : f.type === "select" ? (
                  <Select value={String(draft[f.name] ?? "")} onValueChange={(v) => setDraft({ ...draft, [f.name]: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : f.type === "boolean" ? (
                  <div className="flex h-10 items-center">
                    <Switch checked={!!draft[f.name]} onCheckedChange={(v) => setDraft({ ...draft, [f.name]: v })} />
                  </div>
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={String(draft[f.name] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
                  />
                )}
                {f.help && <p className="mt-1 text-[11px] text-muted-foreground">{f.help}</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => save.mutate(draft)}
              disabled={readOnly || fields.some((f) => f.required && !String(draft[f.name] ?? "").trim())}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. Archive instead if you want to keep the history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteRow && remove.mutate(deleteRow)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
