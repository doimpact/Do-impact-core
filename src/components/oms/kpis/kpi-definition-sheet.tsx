import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { categoryLabel, levelLabel } from "@/lib/kpi-library";
import { ownerLabel, type LiteProfile } from "@/components/owner-select";
import type { KpiRow } from "./kpi-types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">{label}</div>
      <div className="text-sm text-neutral-800 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export function KpiDefinitionSheet({
  kpi, onOpenChange, people, onEdit,
}: {
  kpi: KpiRow | null;
  onOpenChange: (v: boolean) => void;
  people: LiteProfile[];
  onEdit: () => void;
}) {
  return (
    <Sheet open={!!kpi} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {kpi && (
          <>
            <SheetHeader>
              <SheetTitle className="pr-8">{kpi.name}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {kpi.code && <Badge variant="outline">{kpi.code}</Badge>}
                {kpi.category && <Badge variant="secondary">{categoryLabel(kpi.category)}</Badge>}
                {kpi.hierarchy_level != null && <Badge variant="outline">{levelLabel(kpi.hierarchy_level)}</Badge>}
                {kpi.indicator_type && <Badge variant="outline">{kpi.indicator_type}</Badge>}
                <Badge variant="outline">{kpi.frequency}</Badge>
                <Badge variant="outline">{kpi.higher_is_better ? "Higher is better" : "Lower is better"}</Badge>
              </div>

              <Field label="Purpose" value={kpi.purpose ?? kpi.description} />
              <Field label="Formula" value={kpi.formula} />
              <Field label="Unit" value={kpi.unit} />
              <Field label="Target" value={kpi.target == null ? null : `${kpi.target} ${kpi.unit ?? ""}`} />
              <Field label="Data source" value={kpi.data_source} />
              <Field label="Scope" value={kpi.scope} />
              <Field label="Exclusions" value={kpi.exclusions} />
              <Field label="Reporting level" value={kpi.reporting_level} />
              <Field label="Pillar" value={kpi.pillars?.name ?? "Unassigned"} />
              <Field label="Owner" value={ownerLabel(people.find((p) => p.id === kpi.owner_id))} />

              <Button variant="outline" className="w-full" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit definition
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
