import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, ThumbsUp, AlertTriangle } from "lucide-react";
import {
  listPillarNotes,
  addPillarNote,
  updatePillarNote,
  deletePillarNote,
} from "@/lib/oms.functions";
import { Button } from "@/components/ui/button";
import { confirmThen } from "@/components/confirm-dialog";

type Note = { id: string; pillar_id: string; kind: "working_well" | "can_improve"; position: number; content: string };

export function PillarNotes({ pillarId }: { pillarId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listPillarNotes);
  const { data: notes = [] } = useQuery({
    queryKey: ["pillar-notes", pillarId],
    queryFn: () => listFn({ data: { pillarId } }),
  });

  const working = notes.filter((n) => n.kind === "working_well");
  const improve = notes.filter((n) => n.kind === "can_improve");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["pillar-notes", pillarId] });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <NotesColumn title="Working well" tone="good" pillarId={pillarId} kind="working_well" notes={working} onChange={invalidate} />
      <NotesColumn title="Can be improved" tone="warn" pillarId={pillarId} kind="can_improve" notes={improve} onChange={invalidate} />
    </div>
  );
}

function NotesColumn({ title, tone, pillarId, kind, notes, onChange }: {
  title: string; tone: "good" | "warn"; pillarId: string;
  kind: "working_well" | "can_improve"; notes: Note[]; onChange: () => void;
}) {
  const addFn = useServerFn(addPillarNote);
  const addMut = useMutation({
    mutationFn: () => addFn({ data: { pillarId, kind, content: "" } }),
    onSuccess: onChange,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add"),
  });

  const accent = tone === "good" ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60";
  const chip = tone === "good" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
  const Icon = tone === "good" ? ThumbsUp : AlertTriangle;

  return (
    <div className={`rounded-lg border ${accent} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold ${chip}`}>
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={notes.length >= 5 || addMut.isPending} onClick={() => addMut.mutate()}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      {notes.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-4 text-center">No bullets yet. Click Add to capture 3–5 points.</div>
      ) : (
        <ul className="space-y-1.5">{notes.map((n) => (<NoteRow key={n.id} note={n} onChange={onChange} />))}</ul>
      )}
      {notes.length >= 5 && (<div className="mt-2 text-[11px] text-muted-foreground">Max 5 bullets.</div>)}
    </div>
  );
}

function NoteRow({ note, onChange }: { note: Note; onChange: () => void }) {
  const [val, setVal] = useState(note.content);
  const updateFn = useServerFn(updatePillarNote);
  const deleteFn = useServerFn(deletePillarNote);
  const updateMut = useMutation({
    mutationFn: (content: string) => updateFn({ data: { id: note.id, content } }),
    onSuccess: onChange,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteFn({ data: { id: note.id } }),
    onSuccess: onChange,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });
  return (
    <li className="flex items-start gap-2 group">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
      <textarea value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => { if (val !== note.content) updateMut.mutate(val); }} rows={1} placeholder="Type a bullet…" className="flex-1 resize-none bg-transparent text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-300 rounded px-1 py-0.5" />
      <button onClick={() => { confirmThen("Delete this bullet?", () => { deleteMut.mutate(); }) }} disabled={deleteMut.isPending} className="text-neutral-400 hover:text-red-600 mt-1 shrink-0" title="Delete bullet" aria-label="Delete bullet">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
