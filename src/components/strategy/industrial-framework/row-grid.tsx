import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { confirmDialog } from "@/components/confirm-dialog";
import { useFrameworkRows, useRowMutations, type FrameworkRow } from "@/hooks/use-industrial-strategy";

export type GridColumn = {
  key: string;
  label: string;
  type?: "text" | "number" | "select";
  options?: { key: string; label: string }[];
  width?: string;
  placeholder?: string;
};

function Cell({
  col,
  value,
  canEdit,
  onCommit,
}: {
  col: GridColumn;
  value: string;
  canEdit: boolean;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setLocal(value);
  }, [value, dirty]);

  if (!canEdit) return <span className="text-sm">{(col.options?.find((o) => o.key === value)?.label ?? value) || "—"}</span>;

  if (col.type === "select") {
    return (
      <Select value={value || "__none"} onValueChange={(v) => onCommit(v === "__none" ? "" : v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">—</SelectItem>
          {(col.options ?? []).map((o) => (
            <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      className="h-8 text-xs"
      type={col.type === "number" ? "number" : "text"}
      value={local}
      placeholder={col.placeholder}
      onChange={(e) => { setLocal(e.target.value); setDirty(true); }}
      onBlur={() => { if (dirty) { setDirty(false); onCommit(local); } }}
    />
  );
}

export function RowGrid({
  sectionKey,
  columns,
  canEdit,
  addLabel = "Add row",
  emptyLabel = "Nothing captured yet.",
  derived,
  rowAction,
}: {
  sectionKey: string;
  columns: GridColumn[];
  canEdit: boolean;
  addLabel?: string;
  emptyLabel?: string;
  /** Optional derived column rendered after the editable columns. */
  derived?: { label: string; render: (row: FrameworkRow) => ReactNode };
  /** Optional trailing action per row. */
  rowAction?: (row: FrameworkRow) => ReactNode;
}) {
  const { data: allRows = [] } = useFrameworkRows();
  const { add, update, remove } = useRowMutations();
  const rows = allRows.filter((r) => r.section_key === sectionKey);

  const commit = (row: FrameworkRow, key: string, value: string) => {
    update.mutate({ id: row.id, data: { ...row.data, [key]: value } });
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-1 text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className={`px-2 pb-1 font-medium ${c.width ?? ""}`}>{c.label}</th>
              ))}
              {derived && <th className="px-2 pb-1 font-medium">{derived.label}</th>}
              {(rowAction || canEdit) && <th className="px-2 pb-1" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-2 py-3 text-sm italic text-muted-foreground">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="rounded-md bg-muted/40 align-middle">
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-1">
                    <Cell
                      col={c}
                      canEdit={canEdit}
                      value={String(row.data[c.key] ?? "")}
                      onCommit={(v) => commit(row, c.key, v)}
                    />
                  </td>
                ))}
                {derived && <td className="px-2 py-1">{derived.render(row)}</td>}
                {(rowAction || canEdit) && (
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-end gap-1">
                      {rowAction?.(row)}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={async () => {
                            if (await confirmDialog("Delete this row?")) remove.mutate(row.id);
                          }}
                          aria-label="Delete row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => add.mutate({ sectionKey, position: rows.length })}
          disabled={add.isPending}
        >
          <Plus className="mr-1 h-4 w-4" /> {addLabel}
        </Button>
      )}
    </div>
  );
}
