import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useFrameworkEntries, useSaveEntry } from "@/hooks/use-industrial-strategy";

export function useEntry(sectionKey: string, itemKey: string) {
  const { data: entries = [] } = useFrameworkEntries();
  return entries.find((e) => e.section_key === sectionKey && e.item_key === itemKey) ?? null;
}

/** Auto-saving (on blur) text block bound to one framework entry. */
export function EntryField({
  sectionKey,
  itemKey,
  placeholder,
  rows = 3,
  canEdit,
  className,
}: {
  sectionKey: string;
  itemKey: string;
  placeholder?: string;
  rows?: number;
  canEdit: boolean;
  className?: string;
}) {
  const entry = useEntry(sectionKey, itemKey);
  const save = useSaveEntry();
  const [value, setValue] = useState(entry?.content ?? "");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setValue(entry?.content ?? "");
  }, [entry?.content, dirty]);

  if (!canEdit) {
    return (
      <p className={`whitespace-pre-wrap text-sm ${entry?.content ? "text-foreground" : "italic text-muted-foreground"} ${className ?? ""}`}>
        {entry?.content || placeholder || "Not yet defined."}
      </p>
    );
  }

  return (
    <Textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        setValue(e.target.value);
        setDirty(true);
      }}
      onBlur={() => {
        if (!dirty) return;
        setDirty(false);
        save.mutate({ sectionKey, itemKey, content: value });
      }}
    />
  );
}
