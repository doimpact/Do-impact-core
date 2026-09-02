import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wordmark } from "@/components/wordmark";
import { useState } from "react";
import { useMyCompanies, useSetActiveCompany, useCreateCompany, useDeleteCompany } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/select-company")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Workspaces — DO.Impact Core" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SelectCompany,
});

function SelectCompany() {
  const navigate = useNavigate();
  const companiesQ = useMyCompanies();
  const setActive = useSetActiveCompany();
  const create = useCreateCompany();
  const del = useDeleteCompany();
  const [newName, setNewName] = useState("");

  const companies = companiesQ.data ?? [];

  const open = (id: string) =>
    setActive.mutate(id, { onSuccess: () => navigate({ to: "/overview" }) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary" />
          <Wordmark className="text-xl font-bold tracking-tight" />
        </div>
        <h1 className="text-2xl font-bold">Your workspaces</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a company workspace to work in, or create a new one.
        </p>

        <div className="mt-6 space-y-2">
          {companies.map((c) => (
            <div key={c.company_id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => open(c.company_id)}
                className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-medium">{c.companies?.name}</span>
                {c.companies?.is_template && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">sample</span>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
              {!c.companies?.is_template && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Delete workspace">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {c.companies?.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes the workspace and all of its data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          del.mutate(c.company_id, {
                            onSuccess: () => toast.success("Workspace deleted"),
                            onError: () => toast.error("Could not delete workspace"),
                          })
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
          {companiesQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        </div>

        <form
          className="mt-8 space-y-3 rounded-lg border border-border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const name = newName.trim();
            if (!name) return;
            create.mutate(name, {
              onSuccess: (c) => {
                toast.success(`Workspace "${c.name}" created`);
                setActive.mutate(c.id, { onSuccess: () => navigate({ to: "/overview" }) });
              },
              onError: () => toast.error("Could not create workspace"),
            });
          }}
        >
          <Label htmlFor="new-company">New workspace</Label>
          <div className="flex gap-2">
            <Input
              id="new-company"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Acme Manufacturing"
            />
            <Button type="submit" disabled={create.isPending || !newName.trim()} className="gap-2">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
