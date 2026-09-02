import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SectionTabs, SKILLS_TABS } from "@/components/people/section-tabs";
import { confirmThen } from "@/components/confirm-dialog";


export const Route = createFileRoute("/_authenticated/people/skills")({
  head: () => ({ meta: [{ title: "Skills — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SkillsPage,
});

function SkillsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({ name: "", category_id: "", description: "" });
  const [catForm, setCatForm] = useState({ name: "" });

  const { data } = useQuery({
    queryKey: ["skills-catalog"],
    queryFn: async () => {
      const [cats, skills] = await Promise.all([
        supabase.from("skill_categories").select("*").order("sort_order"),
        supabase.from("skills").select("*, skill_categories(name), archived_at").order("name"),
      ]);
      return { categories: cats.data ?? [], skills: skills.data ?? [] };
    },
  });


  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("skills").insert({ name: form.name, category_id: form.category_id || null, description: form.description || null });
      if (error) throw error;
    },
    onSuccess: () => { setOpen(false); setForm({ name: "", category_id: "", description: "" }); qc.invalidateQueries({ queryKey: ["skills-catalog"] }); toast.success("Skill added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const createCat = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("skill_categories").insert({ name: catForm.name });
      if (error) throw error;
    },
    onSuccess: () => { setCatOpen(false); setCatForm({ name: "" }); qc.invalidateQueries({ queryKey: ["skills-catalog"] }); toast.success("Category added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("skills").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills-catalog"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data: rows, error } = await supabase.from("skills")
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!rows || rows.length === 0) throw new Error("Nothing was changed — this workspace is read-only or you don't have permission.");
    },
    onSuccess: (_, vars) => { toast.success(vars.archived ? "Skill archived" : "Skill restored"); qc.invalidateQueries({ queryKey: ["skills-catalog"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = new Map<string, any[]>();
  (data?.skills ?? []).filter((s: any) => showArchived || !s.archived_at).forEach((s: any) => {
    const key = s.skill_categories?.name ?? "Uncategorized";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  });


  return (
    <>
      <SectionTabs tabs={SKILLS_TABS} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skills catalog</h1>
          <p className="text-muted-foreground mt-1">
            {(data?.skills ?? []).filter((s: any) => !s.archived_at).length} active skills
            {(data?.skills ?? []).filter((s: any) => s.archived_at).length > 0 && (
              <span className="ml-1 text-muted-foreground">
                · {(data?.skills ?? []).filter((s: any) => s.archived_at).length} archived
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="show-archived-skills" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="show-archived-skills" className="text-sm text-muted-foreground">Show archived</Label>
          </div>
          <div className="flex gap-2">
            <Dialog open={catOpen} onOpenChange={setCatOpen}>
              <DialogTrigger asChild><Button variant="outline"><Plus className="mr-2 h-4 w-4" />Category</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New category</DialogTitle></DialogHeader>
                <div><Label>Name *</Label><Input value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })} /></div>
                <DialogFooter><Button onClick={() => createCat.mutate()} disabled={!catForm.name}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add skill</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New skill</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Category</Label>
                    <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                      <SelectContent>{data?.categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.name}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>


      <div className="grid gap-4 md:grid-cols-2">
        {Array.from(grouped.entries()).map(([cat, list]) => (
          <Card key={cat}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{cat} <span className="text-xs font-normal text-muted-foreground">({list.length})</span></CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {list.map((s) => (
                <div key={s.id} className={`flex items-center justify-between rounded px-2 py-1 hover:bg-muted/50 ${s.archived_at ? "opacity-60" : ""}`}>
                  <div className="text-sm">
                    <div>{s.archived_at ? <span className="line-through">{s.name}</span> : s.name}</div>
                    {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => archive.mutate({ id: s.id, archived: !s.archived_at })} title={s.archived_at ? "Restore" : "Archive"}>
                      {s.archived_at ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmThen(`Delete ${s.name}?`, () => remove.mutate(s.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>

          </Card>
        ))}
      </div>
    </>
  );
}
