import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/people/org-chart")({
  head: () => ({ meta: [{ title: "Org Chart — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: OrgChartPage,
});

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  manager_id: string | null;
};

function OrgChartPage() {
  const qc = useQueryClient();
  const { data: employees = [] } = useQuery({
    queryKey: ["org-chart-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, job_title, department, manager_id")
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []) as Employee[];
    },
  });

  const [dragId, setDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const { childrenOf, roots, descendantsOf } = useMemo(() => {
    const map = new Map<string | null, Employee[]>();
    for (const e of employees) {
      const key = e.manager_id ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    for (const list of map.values()) {
      list.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
    }
    const desc = (id: string): Set<string> => {
      const out = new Set<string>();
      const stack = [id];
      while (stack.length) {
        const cur = stack.pop()!;
        for (const c of map.get(cur) ?? []) {
          if (!out.has(c.id)) {
            out.add(c.id);
            stack.push(c.id);
          }
        }
      }
      return out;
    };
    return { childrenOf: map, roots: map.get(null) ?? [], descendantsOf: desc };
  }, [employees]);

  const mut = useMutation({
    mutationFn: async (v: { userId: string; managerId: string | null }) => {
      const { error } = await supabase.from("employees").update({ manager_id: v.managerId }).eq("id", v.userId);
      if (error) throw new Error(error.message);
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["org-chart-employees"] });
      const prev = qc.getQueryData<Employee[]>(["org-chart-employees"]);
      if (prev) {
        qc.setQueryData<Employee[]>(
          ["org-chart-employees"],
          prev.map((p) => (p.id === v.userId ? { ...p, manager_id: v.managerId } : p)),
        );
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["org-chart-employees"], ctx.prev);
      toast.error(e instanceof Error ? e.message : "Failed");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["org-chart-employees"] }),
  });

  function handleDrop(targetId: string | null) {
    const id = dragId;
    setDragId(null);
    if (!id) return;
    if (targetId === id) return;
    const current = employees.find((p) => p.id === id);
    if (!current) return;
    if ((current.manager_id ?? null) === targetId) return;
    if (targetId && descendantsOf(id).has(targetId)) {
      toast.error("Can't assign a person under their own report");
      return;
    }
    mut.mutate({ userId: id, managerId: targetId });
  }

  function NodeCard({ p, dim }: { p: Employee; dim?: boolean }) {
    const draggable = useDraggable({ id: p.id });
    const droppable = useDroppable({ id: `drop:${p.id}` });
    const isDragging = draggable.isDragging || dragId === p.id;
    const isOver = droppable.isOver && dragId && dragId !== p.id;
    return (
      <div
        ref={(el) => {
          draggable.setNodeRef(el);
          droppable.setNodeRef(el);
        }}
        {...draggable.listeners}
        {...draggable.attributes}
        style={{ touchAction: "none" }}
        className={
          "min-w-[180px] rounded-lg border bg-card px-3 py-2 text-center shadow-sm transition select-none cursor-grab active:cursor-grabbing " +
          (isOver ? "border-primary ring-2 ring-primary/30 " : "border-border ") +
          (isDragging || dim ? "opacity-50 " : "")
        }
      >
        <div className="font-medium text-sm truncate">{`${p.first_name} ${p.last_name}`}</div>
        <div className="text-xs text-muted-foreground truncate">{p.job_title ?? " "}</div>
        {p.department && <div className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{p.department}</div>}
      </div>
    );
  }

  function Node({ p }: { p: Employee }) {
    const kids = childrenOf.get(p.id) ?? [];
    return (
      <div className="flex flex-col items-center">
        <NodeCard p={p} />
        {kids.length > 0 && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex gap-4 border-t border-border pt-4 relative">
              {kids.map((k) => (
                <div key={k.id} className="flex flex-col items-center">
                  <div className="w-px h-4 bg-border -mt-4" />
                  <Node p={k} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  function RootDrop() {
    const { setNodeRef, isOver } = useDroppable({ id: "drop:__root__" });
    return (
      <div
        ref={setNodeRef}
        className={
          "rounded-lg border-2 border-dashed px-4 py-2 text-xs text-center transition " +
          (isOver && dragId ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground")
        }
      >
        Unassigned (top of org) — drop here to remove manager
      </div>
    );
  }

  const draggedProfile = dragId ? employees.find((p) => p.id === dragId) ?? null : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: DragStartEvent) => setDragId(String(e.active.id))}
      onDragCancel={() => setDragId(null)}
      onDragEnd={(e: DragEndEvent) => {
        const overId = e.over?.id ? String(e.over.id) : null;
        if (!overId) {
          setDragId(null);
          return;
        }
        const target = overId.startsWith("drop:") ? overId.slice(5) : overId;
        handleDrop(target === "__root__" ? null : target);
      }}
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Org Chart
          </h1>
          <p className="text-sm text-muted-foreground">
            Drag a person onto another to set their manager. Drop on "Unassigned" to remove their manager.
          </p>
        </div>
        <RootDrop />
        <div className="overflow-auto rounded-lg border bg-muted/30 p-6">
          {roots.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No active employees yet.</div>
          ) : (
            <div className="flex gap-8 justify-center min-w-max">
              {roots.map((r) => (
                <Node key={r.id} p={r} />
              ))}
            </div>
          )}
        </div>
      </div>
      <DragOverlay>
        {draggedProfile ? (
          <div className="min-w-[180px] rounded-lg border border-primary bg-card px-3 py-2 text-center shadow-lg">
            <div className="font-medium text-sm truncate">{`${draggedProfile.first_name} ${draggedProfile.last_name}`}</div>
            <div className="text-xs text-muted-foreground truncate">{draggedProfile.job_title ?? " "}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
