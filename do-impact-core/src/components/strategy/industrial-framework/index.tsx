import { getCurrentUser } from "@/lib/auth-session";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Compass,
  Factory,
  ListChecks,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ADVANTAGES,
  AVOID,
  CASCADE,
  COMPONENTS,
  DELIVERABLES,
  EXECUTIVE_PRINCIPLE,
  MATURITY,
  PHASES,
  PRODUCT_BUCKETS,
  STEPS,
  SUPPLIER_CLASSES,
  TWELVE_QUESTIONS,
  VALUE_CHAIN,
  segmentBucket,
} from "@/lib/industrial-strategy-framework";
import { useFrameworkEntries, useSaveEntry, useFrameworkRows } from "@/hooks/use-industrial-strategy";
import { EntryField } from "./entry-field";
import { RowGrid } from "./row-grid";
import { Cockpit } from "./cockpit";

function Section({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border p-5">
      {eyebrow && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
      )}
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function IndustrialFramework({ canEdit }: { canEdit: boolean }) {
  const { data: entries = [] } = useFrameworkEntries();
  const { data: rows = [] } = useFrameworkRows();
  const saveEntry = useSaveEntry();
  const qc = useQueryClient();

  const entryFor = (section: string, item: string) =>
    entries.find((e) => e.section_key === section && e.item_key === item) ?? null;

  const selectedAdvantages = useMemo(
    () => entries.filter((e) => e.section_key === "how-to-win" && e.status === "selected").map((e) => e.item_key),
    [entries],
  );

  const componentProgress = COMPONENTS.filter((c) => (entryFor("components", c.key)?.content ?? "").trim().length > 0).length;
  const stepsDone = STEPS.filter((s) => entryFor("steps", s.key)?.status === "done").length;
  const phasesDone = PHASES.filter((p) => entryFor("phases", p.key)?.status === "done").length;

  // Push an initiative row into the Progress board.
  const { data: workstreams = [] } = useQuery({
    queryKey: ["isf-workstreams"],
    queryFn: async () =>
      ((await supabase.from("workstreams").select("id,name").order("name")).data ?? []) as { id: string; name: string }[],
  });

  const push = useMutation({
    mutationFn: async (input: { title: string; ownerHint?: string }) => {
      const wsId = workstreams[0]?.id;
      if (!wsId) throw new Error("Create a workstream group in Progress first");
      const { data: userData } = await getCurrentUser();
      const { error } = await supabase.from("initiatives").insert({
        title: input.title,
        workstream_id: wsId,
        current_stage: "L1",
        progress: 0,
        owner_id: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pushed to Progress");
      qc.invalidateQueries({ queryKey: ["initiatives"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not push"),
  });

  const toggleAdvantage = (key: string) => {
    const current = entryFor("how-to-win", key);
    const next = current?.status === "selected" ? "open" : "selected";
    if (next === "selected" && selectedAdvantages.length >= 3) {
      toast.warning("Two or three advantages — not more. Deselect one first.");
      return;
    }
    saveEntry.mutate({ sectionKey: "how-to-win", itemKey: key, status: next });
  };

  return (
    <div className="space-y-6">
      {/* Executive principle */}
      <section className="relative overflow-hidden rounded-2xl bg-neutral-900 p-7 text-neutral-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#0ea5e9,_transparent_55%)] opacity-20" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
            <Factory className="h-3.5 w-3.5" /> Industrial Strategy Framework
          </div>
          <p className="mt-3 max-w-4xl text-lg font-medium leading-snug">{EXECUTIVE_PRINCIPLE}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-300">
            {VALUE_CHAIN.map((v, i) => (
              <span key={v} className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1">{v}</span>
                {i < VALUE_CHAIN.length - 1 && <ChevronRight className="h-3 w-3 text-neutral-500" />}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-neutral-400">
            <span>{componentProgress}/9 components defined</span>
            <span>{stepsDone}/16 steps complete</span>
            <span>{phasesDone}/9 phases complete</span>
          </div>
        </div>
      </section>

      {/* Strategy on a page */}
      <Section
        eyebrow="Deliverable 1"
        title="Industrial strategy on a page"
        description="The strategic cascade. If it does not fit on this page, it is not yet a strategy."
      >
        <div className="space-y-2">
          {CASCADE.map((band, i) => (
            <div key={band.key}>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{band.label}</span>
                  <span className="text-xs text-muted-foreground">{band.question}</span>
                </div>
                <EntryField
                  sectionKey="cascade"
                  itemKey={band.key}
                  canEdit={canEdit}
                  rows={2}
                  className="mt-2"
                  placeholder={band.hint}
                />
              </div>
              {i < CASCADE.length - 1 && (
                <div className="flex justify-center py-0.5 text-muted-foreground/60">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Nine components */}
      <Section
        eyebrow="Architecture"
        title="The nine integrated components"
        description="Facilities, capacity, vertical integration, process technology, systems, sourcing and people are interconnected. Optimizing one in isolation can make the whole system worse."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COMPONENTS.map((c) => {
            const filled = (entryFor("components", c.key)?.content ?? "").trim().length > 0;
            return (
              <div key={c.key} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.question}</div>
                  </div>
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${filled ? "bg-emerald-500" : "bg-neutral-300"}`} />
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">Output: {c.output}</div>
                <ul className="mt-2 space-y-0.5 text-xs text-foreground/70">
                  {c.prompts.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
                <EntryField
                  sectionKey="components"
                  itemKey={c.key}
                  canEdit={canEdit}
                  rows={3}
                  className="mt-3"
                  placeholder="Our answer…"
                />
              </div>
            );
          })}
        </div>
      </Section>

      {/* Where to play */}
      <Section
        eyebrow="Step 3"
        title="Where to play — segment attractiveness × right to win"
        description="Score 1–5 on each axis. Segments auto-bucket into INVEST, BUILD, MAINTAIN or EXIT."
      >
        <RowGrid
          sectionKey="segments"
          canEdit={canEdit}
          addLabel="Add segment"
          emptyLabel="No segments scored yet."
          columns={[
            { key: "segment", label: "Segment", placeholder: "Application / customer group" },
            { key: "attractiveness", label: "Attractiveness (1–5)", type: "number" },
            { key: "rightToWin", label: "Right to win (1–5)", type: "number" },
            { key: "notes", label: "Why" },
          ]}
          derived={{
            label: "Call",
            render: (row) => {
              const b = segmentBucket(Number(row.data.attractiveness) || 0, Number(row.data.rightToWin) || 0);
              return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.tone}`}>{b.label}</span>;
            },
          }}
        />
      </Section>

      {/* How to win */}
      <Section
        eyebrow="Step 4"
        title="How we win"
        description="Pick two or three. The mistake is trying to be best at everything."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((a) => {
            const on = selectedAdvantages.includes(a.key);
            return (
              <button
                key={a.key}
                type="button"
                disabled={!canEdit}
                onClick={() => toggleAdvantage(a.key)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  on ? "border-primary bg-primary/10" : "border-border hover:bg-muted/60"
                } ${canEdit ? "" : "cursor-default"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{a.label}</span>
                  {on && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.claim}</p>
              </button>
            );
          })}
        </div>
        {selectedAdvantages.length > 3 && (
          <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <CircleAlert className="h-3.5 w-3.5" /> More than three advantages is not a strategy.
          </p>
        )}
        <EntryField
          sectionKey="how-to-win"
          itemKey="rationale"
          canEdit={canEdit}
          rows={2}
          className="mt-3"
          placeholder="Why these — and what we are deliberately giving up."
        />
      </Section>

      {/* Capability map */}
      <Section
        eyebrow="Step 5"
        title="Strategy-to-capability map"
        description="For every competitive requirement, name the capability it demands. The question is what we must become exceptionally good at — not what equipment to buy."
      >
        <RowGrid
          sectionKey="capabilities"
          canEdit={canEdit}
          addLabel="Add capability"
          emptyLabel="No capabilities mapped yet."
          columns={[
            { key: "requirement", label: "Competitive requirement", placeholder: "2-week delivery" },
            { key: "capability", label: "Required capability", placeholder: "Flexible capacity + short setups" },
            { key: "maturity", label: "Maturity", type: "select", options: MATURITY.map((m) => ({ key: m.key, label: m.label })) },
            { key: "action", label: "Action / owner" },
          ]}
        />
      </Section>

      {/* Product portfolio */}
      <Section
        eyebrow="Step 6"
        title="Product portfolio strategy"
        description="Grow, fix, simplify, harvest or exit — based on economics and complexity, not habit."
      >
        <RowGrid
          sectionKey="products"
          canEdit={canEdit}
          addLabel="Add product"
          emptyLabel="No products assessed yet."
          columns={[
            { key: "product", label: "Product / family" },
            { key: "revenue", label: "Revenue", type: "number" },
            { key: "margin", label: "Contribution %", type: "number" },
            { key: "complexity", label: "Complexity", type: "select", options: [
              { key: "low", label: "Low" }, { key: "med", label: "Medium" }, { key: "high", label: "High" },
            ] },
            { key: "bucket", label: "Call", type: "select", options: PRODUCT_BUCKETS.map((b) => ({ key: b.key, label: b.label })) },
          ]}
        />
      </Section>

      {/* Manufacturing model */}
      <Section
        eyebrow="Step 7"
        title="Manufacturing model — make, buy or partner"
        description="Make when differentiating, IP-critical, quality-critical or supply-risky. Buy when standardized. Partner when a specialized capability is required."
      >
        <RowGrid
          sectionKey="mfg-model"
          canEdit={canEdit}
          addLabel="Add process / family"
          emptyLabel="No make-buy decisions recorded yet."
          columns={[
            { key: "scope", label: "Process / product family" },
            { key: "decision", label: "Decision", type: "select", options: [
              { key: "make", label: "Make" }, { key: "buy", label: "Buy" }, { key: "partner", label: "Partner" },
            ] },
            { key: "reason", label: "Why (differentiating, IP, quality, risk, economics)" },
            { key: "action", label: "Action / owner" },
          ]}
        />
        <EntryField
          sectionKey="mfg-model"
          itemKey="operating-model"
          canEdit={canEdit}
          rows={3}
          className="mt-3"
          placeholder="Operating model: flow and layout, WIP and setup, planning, quality, maintenance, daily management…"
        />
      </Section>

      {/* Capacity strategy */}
      <Section
        eyebrow="Step 8"
        title="Capacity strategy"
        description="Demand → required hours → available hours → utilisation → bottleneck → response. Sequence the answer: improve, debottleneck, equipment, shift, outsource, facility."
      >
        <RowGrid
          sectionKey="capacity"
          canEdit={canEdit}
          addLabel="Add demand case"
          emptyLabel="No capacity cases modelled yet."
          columns={[
            { key: "case", label: "Case", type: "select", options: [
              { key: "current", label: "Current" }, { key: "base", label: "Base" },
              { key: "high", label: "High" }, { key: "downside", label: "Downside" },
            ] },
            { key: "demand", label: "Demand (units/rev)", type: "number" },
            { key: "required", label: "Required hours", type: "number" },
            { key: "available", label: "Available hours", type: "number" },
            { key: "bottleneck", label: "Bottleneck" },
            { key: "response", label: "Response" },
          ]}
          derived={{
            label: "Utilisation",
            render: (row) => {
              const req = Number(row.data.required) || 0;
              const av = Number(row.data.available) || 0;
              if (!req || !av) return <span className="text-xs text-muted-foreground">—</span>;
              const pct = Math.round((req / av) * 100);
              const tone = pct > 100 ? "bg-red-100 text-red-800" : pct > 90 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800";
              return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{pct}%</span>;
            },
          }}
        />
      </Section>

      {/* Footprint strategy */}
      <Section
        eyebrow="Step 9"
        title="Footprint strategy — total landed cost"
        description="Compare options on total landed cost, never labour cost alone: material, energy, freight, duties, inventory, quality, working capital and risk."
      >
        <RowGrid
          sectionKey="footprint"
          canEdit={canEdit}
          addLabel="Add option"
          emptyLabel="No footprint options costed yet."
          columns={[
            { key: "option", label: "Site / option" },
            { key: "labour", label: "Labour", type: "number" },
            { key: "material", label: "Material + freight", type: "number" },
            { key: "overhead", label: "Facility + overhead", type: "number" },
            { key: "risk", label: "Risk / quality cost", type: "number" },
            { key: "landed", label: "Total landed cost", type: "number" },
            { key: "call", label: "Call", type: "select", options: [
              { key: "recommend", label: "Recommend" }, { key: "hold", label: "Hold" }, { key: "reject", label: "Reject" },
            ] },
          ]}
        />
      </Section>

      {/* Supply chain segmentation */}
      <Section
        eyebrow="Step 10"
        title="Supplier segmentation & risk"
        description="Classify every critical supplier, then build the risk heat map."
      >
        <RowGrid
          sectionKey="suppliers"
          canEdit={canEdit}
          addLabel="Add supplier"
          emptyLabel="No suppliers classified yet."
          columns={[
            { key: "supplier", label: "Supplier / material" },
            { key: "spend", label: "Spend", type: "number" },
            { key: "leadTime", label: "Lead time (wks)", type: "number" },
            { key: "class", label: "Class", type: "select", options: SUPPLIER_CLASSES.map((c) => ({ key: c.toLowerCase(), label: c })) },
            { key: "risk", label: "Risk", type: "select", options: [
              { key: "low", label: "Low" }, { key: "med", label: "Medium" }, { key: "high", label: "High" },
            ] },
            { key: "mitigation", label: "Mitigation" },
          ]}
        />
        <div className="mt-3">
          <Link to="/oms/supply-chain" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Open Supply Chain <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Section>

      {/* Technology strategy */}
      <Section
        eyebrow="Step 11"
        title="Technology strategy"
        description="Business problem → economic opportunity → technical solution → ROI → implementation capability. Never cool technology in search of a use case."
      >
        <RowGrid
          sectionKey="technology"
          canEdit={canEdit}
          addLabel="Add technology"
          emptyLabel="No technology cases defined yet."
          columns={[
            { key: "problem", label: "Business problem" },
            { key: "solution", label: "Technology / solution" },
            { key: "value", label: "Annual value", type: "number" },
            { key: "investment", label: "Investment", type: "number" },
            { key: "readiness", label: "Our readiness", type: "select", options: MATURITY.map((m) => ({ key: m.key, label: m.label })) },
            { key: "call", label: "Call", type: "select", options: [
              { key: "now", label: "Do now" }, { key: "next", label: "Next" }, { key: "later", label: "Later" }, { key: "no", label: "No" },
            ] },
          ]}
        />
      </Section>

      {/* Cost transformation */}
      <Section
        eyebrow="Step 12"
        title="Cost transformation levers"
        description="Attack the structural drivers — material, labour, equipment and complexity — from a clean-sheet cost model."
      >
        <RowGrid
          sectionKey="cost"
          canEdit={canEdit}
          addLabel="Add lever"
          emptyLabel="No cost levers defined yet."
          columns={[
            { key: "area", label: "Area", type: "select", options: [
              { key: "material", label: "Material" }, { key: "labour", label: "Labour" },
              { key: "equipment", label: "Equipment" }, { key: "overhead", label: "Overhead" },
              { key: "complexity", label: "Complexity" }, { key: "quality", label: "Quality / warranty" },
            ] },
            { key: "lever", label: "Lever" },
            { key: "baseline", label: "Baseline cost", type: "number" },
            { key: "target", label: "Target cost", type: "number" },
            { key: "saving", label: "Annual saving", type: "number" },
            { key: "owner", label: "Owner" },
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to="/strategy/capex" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Turnaround Finance <ArrowRight className="h-3 w-3" />
          </Link>
          <Link to="/actions/calculators" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Calculators <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Section>

      {/* Quality strategy */}
      <Section
        eyebrow="Step 13"
        title="Quality strategy"
        description="Move from inspect–detect–correct to design–prevent–control. Track the metric, the current level and the prevention action."
      >
        <RowGrid
          sectionKey="quality"
          canEdit={canEdit}
          addLabel="Add focus area"
          emptyLabel="No quality focus areas defined yet."
          columns={[
            { key: "metric", label: "Metric", placeholder: "Customer PPM, FPY, COPQ…" },
            { key: "current", label: "Current", type: "number" },
            { key: "target", label: "Target", type: "number" },
            { key: "driver", label: "Main driver" },
            { key: "action", label: "Prevention action" },
            { key: "owner", label: "Owner" },
          ]}
        />
      </Section>

      {/* Organization & talent */}
      <Section
        eyebrow="Step 14"
        title="Organization & talent"
        description="The minimum critical capability set per function — then leverage, develop, hire, partner or acquire."
      >
        <RowGrid
          sectionKey="org-talent"
          canEdit={canEdit}
          addLabel="Add capability"
          emptyLabel="No organizational capabilities assessed yet."
          columns={[
            { key: "function", label: "Function" },
            { key: "capability", label: "Required capability" },
            { key: "maturity", label: "Have it?", type: "select", options: MATURITY.map((m) => ({ key: m.key, label: m.label })) },
            { key: "action", label: "Action", type: "select", options: [
              { key: "leverage", label: "Leverage" }, { key: "develop", label: "Develop" },
              { key: "hire", label: "Hire" }, { key: "partner", label: "Partner" }, { key: "acquire", label: "Acquire" },
            ] },
            { key: "owner", label: "Owner" },
          ]}
        />
      </Section>

      {/* Capital allocation */}
      <Section
        eyebrow="Step 15"
        title="Capital allocation"
        description="Every request competes on the same framework: strategic importance × economic return × risk × capability impact. Local ROI does not override strategic fit."
      >
        <RowGrid
          sectionKey="capital"
          canEdit={canEdit}
          addLabel="Add request"
          emptyLabel="No capital requests scored yet."
          columns={[
            { key: "request", label: "Capital request" },
            { key: "amount", label: "Amount", type: "number" },
            { key: "fit", label: "Strategic fit (1–5)", type: "number" },
            { key: "return", label: "Return (1–5)", type: "number" },
            { key: "risk", label: "Risk (1–5, 5 = low)", type: "number" },
            { key: "timing", label: "Timing" },
            { key: "decision", label: "Decision", type: "select", options: [
              { key: "fund", label: "Fund" }, { key: "phase", label: "Phase" },
              { key: "hold", label: "Hold" }, { key: "reject", label: "Reject" },
            ] },
          ]}
          derived={{
            label: "Score",
            render: (row) => {
              const vals = ["fit", "return", "risk"].map((k) => Number(row.data[k]) || 0);
              if (vals.every((v) => !v)) return <span className="text-xs text-muted-foreground">—</span>;
              const score = vals.reduce((a, b) => a + b, 0);
              const tone = score >= 12 ? "bg-emerald-100 text-emerald-800" : score >= 8 ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground";
              return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{score}/15</span>;
            },
          }}
        />
      </Section>

      {/* 16 steps */}
      <Section
        eyebrow="Working guide"
        title="The 16 steps"
        description="Work through them in order. Each step has a checklist, a place for notes and a shortcut into the module that does the heavy lifting."
      >
        <Accordion type="multiple" className="w-full">
          {STEPS.map((s) => {
            const done = entryFor("steps", s.key)?.status === "done";
            return (
              <AccordionItem key={s.key} value={s.key}>
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                      {s.n}
                    </span>
                    <span className="text-sm font-medium">{s.title}</span>
                    {done && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{s.intro}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {s.checklist.map((c) => (
                      <li key={c} className="flex gap-2">
                        <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  {s.links && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {s.links.map((l) => (
                        <Link key={l.to} to={l.to} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          {l.label} <ArrowRight className="h-3 w-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                  <EntryField
                    sectionKey="steps"
                    itemKey={s.key}
                    canEdit={canEdit}
                    rows={3}
                    className="mt-3"
                    placeholder="Findings, decisions, owner…"
                  />
                  {canEdit && (
                    <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={done}
                        onCheckedChange={() =>
                          saveEntry.mutate({ sectionKey: "steps", itemKey: s.key, status: done ? "open" : "done" })
                        }
                      />
                      Step complete
                    </label>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Section>

      {/* Initiative portfolio */}
      <Section
        eyebrow="Step 16"
        title="Strategic initiative portfolio"
        description="8–12 genuine strategic choices, 10–20 funded initiatives. Push any of them into the Progress board to run them."
      >
        <RowGrid
          sectionKey="initiatives"
          canEdit={canEdit}
          addLabel="Add initiative"
          emptyLabel="No initiatives defined yet."
          columns={[
            { key: "objective", label: "Strategic objective" },
            { key: "initiative", label: "Initiative" },
            { key: "owner", label: "Accountable owner" },
            { key: "baseline", label: "Baseline" },
            { key: "target", label: "Target" },
            { key: "impact", label: "Financial impact", type: "number" },
            { key: "investment", label: "Investment", type: "number" },
            { key: "timing", label: "Timing" },
            { key: "kpi", label: "KPI" },
            { key: "risk", label: "Risks" },
          ]}
          rowAction={(row) =>
            canEdit ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                disabled={push.isPending}
                onClick={() => {
                  const title = String(row.data.initiative ?? "").trim();
                  if (!title) return toast.error("Name the initiative first");
                  push.mutate({ title });
                }}
              >
                <Send className="h-3.5 w-3.5" /> Progress
              </Button>
            ) : null
          }
        />
      </Section>

      {/* Process phases */}
      <Section
        eyebrow="The strategy process"
        title="10–12 week fact-based process"
        description="Nine phases, each with an explicit output. Mark a phase complete when its deliverable exists."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PHASES.map((p) => {
            const done = entryFor("phases", p.key)?.status === "done";
            return (
              <div key={p.key} className={`rounded-lg border p-4 ${done ? "border-emerald-300 bg-emerald-50/50" : "border-border"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Phase {p.n} · {p.label}</span>
                  <span className="text-[11px] text-muted-foreground">{p.weeks}</span>
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-foreground/70">
                  {p.collect.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
                <div className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Output: {p.output}
                </div>
                <EntryField
                  sectionKey="phases"
                  itemKey={p.key}
                  canEdit={canEdit}
                  rows={2}
                  className="mt-2"
                  placeholder="Owner, dates, status"
                />
                {canEdit && (
                  <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-xs">
                    <Checkbox
                      checked={done}
                      onCheckedChange={() =>
                        saveEntry.mutate({ sectionKey: "phases", itemKey: p.key, status: done ? "open" : "done" })
                      }
                    />
                    Phase complete
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Cockpit */}
      <Cockpit canEdit={canEdit} />

      {/* Guardrails */}
      <Section
        eyebrow="Guardrails"
        title="What to avoid — and the 12 opening questions"
        description="Start here with the owner or CEO. The answers usually reveal the strategy."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">What I would avoid</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {AVOID.map((a) => (
                <li key={a.label} className="rounded-md border border-border p-2">
                  <span className="font-medium">{a.label}</span>
                  <span className="block text-xs text-muted-foreground">{a.why}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">The 12 questions</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {TWELVE_QUESTIONS.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
            <EntryField
              sectionKey="guardrails"
              itemKey="twelve-questions"
              canEdit={canEdit}
              rows={5}
              className="mt-3"
              placeholder="Answer these — briefly, in numbers where you can."
            />
          </div>
        </div>
      </Section>

      {/* Deliverables */}
      <Section
        eyebrow="Output"
        title="The ten core deliverables"
        description="Everything else is supporting analysis behind these."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {DELIVERABLES.map((d, i) => (
            <div key={d} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              {d}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Compass className="h-3.5 w-3.5" /> The question the strategy must answer
          </div>
          <p className="mt-2 text-sm">
            What can we become exceptionally good at that a larger competitor would find difficult to replicate
            economically? That combination becomes the company's industrial moat.
          </p>
          <EntryField
            sectionKey="guardrails"
            itemKey="moat"
            canEdit={canEdit}
            rows={2}
            className="mt-3"
            placeholder="Our industrial moat…"
          />
        </div>
      </Section>

      {rows.length === 0 && !canEdit && (
        <p className="text-sm italic text-muted-foreground">This workspace is read-only.</p>
      )}
    </div>
  );
}
