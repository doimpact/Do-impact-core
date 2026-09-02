import { createFileRoute } from "@tanstack/react-router";
import { NumberFormatMenu } from "@/components/number-format-menu";
import { useNumberFormat } from "@/lib/number-format";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/csar";
import { toast } from "sonner";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { confirmDialog, promptDialog } from "@/components/confirm-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfiles, ownerLabel } from "@/components/owner-select";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

const OPP_STAGE_PROB: Record<string, number> = { prospect: 0.2, proposal: 0.6, won: 1, lost: 0 };

export const Route = createFileRoute("/_authenticated/commercial/plan")({
  head: () => ({ meta: [{ title: "Plan vs Pipeline — DO.Impact" }] }),
  component: PlanPage,
});

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatAxisMoney(value: number | string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return formatMoney(n);
}

function PlanPage() {
  useNumberFormat(); // re-render when the money display setting changes
  const qc = useQueryClient();
  const { data: targets } = useQuery({
    queryKey: ["targets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("growth_targets").select("*").order("year").order("month");
      if (error) throw error;
      return data;
    },
  });
  const { data: backlog } = useQuery({
    queryKey: ["booked-backlog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("booked_backlog").select("*").order("year").order("month");
      if (error) throw error;
      return data;
    },
  });
  const { data: opps } = useQuery({
    queryKey: ["opps-for-plan"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities")
        .select("id, name, value, stage, probability, expected_close_date, account_id, contact_id, owner_id, accounts(name), contacts(name), opportunity_monthly_values(year, month, amount)");
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: profiles = [] } = useProfiles();

  const years = useMemo(() => Array.from(new Set((targets ?? []).map((t) => t.year))).sort(), [targets]);

  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [streams, setStreams] = useState<string[]>([]);

  const accountOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of opps ?? []) if (o.account_id) m.set(o.account_id, o.accounts?.name ?? "Account");
    return Array.from(m, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [opps]);

  const ownerOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const o of opps ?? []) if (o.owner_id) ids.add(o.owner_id);
    return Array.from(ids)
      .map((id) => ({ value: id, label: ownerLabel(profiles.find((p) => p.id === id)) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [opps, profiles]);

  const contactOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of opps ?? []) if (o.contact_id) m.set(o.contact_id, o.contacts?.name ?? "Contact");
    return Array.from(m, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [opps]);

  const stageOptions = useMemo(() => {
    const s = new Set<string>();
    for (const o of opps ?? []) if (o.stage !== "won" && o.stage !== "lost") s.add(String(o.stage));
    return Array.from(s).sort().map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
  }, [opps]);

  const streamOptions = useMemo(() => {
    const s = new Set<string>();
    for (const b of backlog ?? []) s.add(b.stream || "Default");
    return Array.from(s).sort().map((v) => ({ value: v, label: v }));
  }, [backlog]);

  const pipelineFiltered = accountIds.length > 0 || ownerIds.length > 0 || contactIds.length > 0;
  const anyFilter = pipelineFiltered || stages.length > 0 || streams.length > 0;
  const showBooked = !pipelineFiltered;

  const matchingOpps = useMemo(
    () => (opps ?? []).filter((o) => {
      if (o.stage === "won" || o.stage === "lost") return false;
      if (accountIds.length && !accountIds.includes(o.account_id)) return false;
      if (ownerIds.length && !(o.owner_id && ownerIds.includes(o.owner_id))) return false;
      if (contactIds.length && !(o.contact_id && contactIds.includes(o.contact_id))) return false;
      if (stages.length && !stages.includes(String(o.stage))) return false;
      return true;
    }),
    [opps, accountIds, ownerIds, contactIds, stages],
  );

  const chartData = useMemo(() => {
    if (!targets) return [];
    const backlogMap = new Map<string, number>();
    for (const b of backlog ?? []) {
      if (streams.length && !streams.includes(b.stream || "Default")) continue;
      const k = `${b.year}-${String(b.month).padStart(2, "0")}`;
      backlogMap.set(k, (backlogMap.get(k) ?? 0) + Number(b.amount || 0));
    }
    const weightedMap = new Map<string, number>();
    for (const o of matchingOpps) {
      const prob = o.probability != null ? Number(o.probability) / 100 : (OPP_STAGE_PROB[o.stage as string] ?? 0);
      const monthly = o.opportunity_monthly_values as { year: number; month: number; amount: number }[] | null;
      if (monthly && monthly.length) {
        for (const m of monthly) {
          const k = `${m.year}-${String(m.month).padStart(2, "0")}`;
          weightedMap.set(k, (weightedMap.get(k) ?? 0) + Number(m.amount || 0) * prob);
        }
      } else if (o.expected_close_date) {
        const d = new Date(o.expected_close_date);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        weightedMap.set(k, (weightedMap.get(k) ?? 0) + Number(o.value || 0) * prob);
      }
    }
    return targets.map((t) => {
      const key = `${t.year}-${String(t.month).padStart(2, "0")}`;
      const booked = showBooked ? (backlogMap.get(key) ?? 0) : 0;
      const weighted = weightedMap.get(key) ?? 0;
      return {
        label: `${MONTHS[t.month - 1]} ${String(t.year).slice(2)}`,
        year: t.year, month: t.month,
        target: Number(t.amount),
        booked,
        weighted,
        weightedBacklog: booked + weighted,
      };
    });
  }, [targets, backlog, matchingOpps, streams, showBooked]);

  const yearRollups = useMemo(() => {
    const map = new Map<number, { target: number; booked: number; weighted: number }>();
    for (const r of chartData) {
      const cur = map.get(r.year) ?? { target: 0, booked: 0, weighted: 0 };
      cur.target += r.target; cur.booked += r.booked; cur.weighted += r.weighted;
      map.set(r.year, cur);
    }
    return Array.from(map.entries()).map(([year, v]) => ({ year, ...v }));
  }, [chartData]);

  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  useEffect(() => {
    if (years.length && selectedYears.length === 0) setSelectedYears(years);
  }, [years, selectedYears.length]);
  const filteredChartData = useMemo(
    () => (selectedYears.length ? chartData.filter((r) => selectedYears.includes(r.year)) : chartData),
    [chartData, selectedYears],
  );

  function clearFilters() {
    setAccountIds([]); setOwnerIds([]); setContactIds([]); setStages([]); setStreams([]);
  }

  async function addPlanYear() {
    const suggested = years.length ? Math.max(...years) + 1 : new Date().getFullYear();
    const raw = await promptDialog({
      title: "Add plan year",
      description: "Creates twelve monthly target rows you can then fill in.",
      label: "Year",
      defaultValue: String(suggested),
    });
    if (raw == null) return;
    const year = Number(raw);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return toast.error("Enter a year between 2000 and 2100");
    if (years.includes(year)) return toast.error(`${year} already exists`);
    const rows = Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1, amount: 0 }));
    const { error } = await supabase.from("growth_targets").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Added ${year}`);
    setSelectedYears((prev) => (prev.length ? [...prev, year].sort() : prev));
    qc.invalidateQueries({ queryKey: ["targets"] });
  }

  async function removePlanYear(year: number) {
    const ok = await confirmDialog({
      title: `Remove ${year} targets?`,
      description: "The monthly plan targets for this year will be deleted.",
      confirmLabel: "Remove year",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("growth_targets").delete().eq("year", year);
    if (error) return toast.error(error.message);
    toast.success(`Removed ${year}`);
    setSelectedYears((prev) => prev.filter((y) => y !== year));
    qc.invalidateQueries({ queryKey: ["targets"] });
  }


  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">3-year plan vs pipeline</h1>
        <p className="text-sm text-muted-foreground">Set monthly targets, then compare against booked backlog and weighted pipeline.</p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Plan vs pipeline (monthly)</CardTitle>
              <NumberFormatMenu variant="inline" />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Years:</span>
              {years.map((y) => {
                const active = selectedYears.includes(y);
                return (
                  <Button key={y} size="sm" variant={active ? "default" : "outline"}
                    onClick={() => setSelectedYears((prev) => {
                      const next = prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y].sort();
                      return next.length ? next : [y];
                    })}>{y}</Button>
                );
              })}
              {years.length > 0 && <Button size="sm" variant="ghost" onClick={() => setSelectedYears(years)}>All</Button>}
              <Button size="sm" variant="outline" onClick={addPlanYear}>
                <Plus className="h-4 w-4 mr-1" /> Add plan year
              </Button>

            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MultiFilter label="Account" options={accountOptions} selected={accountIds} onChange={setAccountIds} />
            <MultiFilter label="Owner" options={ownerOptions} selected={ownerIds} onChange={setOwnerIds} />
            <MultiFilter label="Stakeholder" options={contactOptions} selected={contactIds} onChange={setContactIds} />
            <MultiFilter label="Stage" options={stageOptions} selected={stages} onChange={setStages} />
            <MultiFilter label="Backlog stream" options={streamOptions} selected={streams} onChange={setStreams} />
            <span className="text-xs text-muted-foreground">{matchingOpps.length} opportunities</span>
            {anyFilter && <Button size="sm" variant="ghost" onClick={clearFilters}>Clear all</Button>}
          </div>
          {!showBooked && (
            <p className="text-xs text-muted-foreground">
              Booked backlog is tracked by value stream only, so it is hidden while an account, owner or stakeholder filter is active.
            </p>
          )}
        </CardHeader>
        <CardContent className={years.length === 0 ? "" : "h-[380px]"}>
          {years.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-12 text-center">
              <p className="text-sm font-medium">No plan years yet</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Add a year to set monthly targets and compare against booked backlog and weighted pipeline.
              </p>
              <Button size="sm" onClick={addPlanYear}>
                <Plus className="h-4 w-4 mr-1" /> Add plan year
              </Button>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredChartData} margin={{ left: 12, right: 12, top: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="gBooked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="gWeighted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={2} axisLine={false} tickLine={false} />
              <YAxis width={68} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={formatAxisMoney} axisLine={false} tickLine={false} />

              <Tooltip formatter={(v: number) => formatMoney(v)}
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              {showBooked && <Bar dataKey="booked" name="Booked backlog" stackId="backlog" fill="url(#gBooked)" />}
              <Bar dataKey="weighted" name="Weighted opportunities" stackId="backlog" fill="url(#gWeighted)" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="weightedBacklog" name={showBooked ? "Weighted backlog total" : "Weighted pipeline total"} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: "#2563eb" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="target" name="Plan target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </CardContent>

      </Card>


      <div className="grid md:grid-cols-3 gap-3">
        {yearRollups.map((y) => (
          <Card key={y.year}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{y.year} rollup</div>
              <div className="mt-2 space-y-1 text-sm">
                <Row label="Plan target" value={formatMoney(y.target)} />
                <Row label="Booked backlog" value={showBooked ? formatMoney(y.booked) : "—"} />
                <Row label="Weighted pipeline" value={formatMoney(y.weighted)} />
                <Row label="Coverage" value={y.target > 0 ? `${Math.round(((y.booked + y.weighted) / y.target) * 100)}%` : "—"} bold />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {years.map((year) => (
        <TargetEditor key={year} year={year}
          targets={(targets ?? []).filter((t) => t.year === year)}
          onRemove={() => removePlanYear(year)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["targets"] })} />
      ))}


      {years.map((year) => {
        const yearMonths = (targets ?? []).filter((t) => t.year === year).map((t) => t.month).sort((a, b) => a - b);
        const months = yearMonths.length ? yearMonths : Array.from({ length: 12 }, (_, i) => i + 1);
        return (
          <BacklogEditor key={`bl-${year}`} year={year} months={months}
            allRows={(backlog ?? []).filter((b) => b.year === year) as any}
            onSaved={() => qc.invalidateQueries({ queryKey: ["booked-backlog"] })} />
        );
      })}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function TargetEditor({ year, targets, onSaved, onRemove }: { year: number; targets: any[]; onSaved: () => void; onRemove: () => void }) {
  const [values, setValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const v: Record<number, string> = {};
    for (const t of targets) v[t.month] = String(t.amount);
    setValues(v);
  }, [targets]);

  async function saveAll() {
    setSaving(true);
    const rows = targets.map((t) => ({ id: t.id, year: t.year, month: t.month, amount: Number(values[t.month] ?? t.amount) || 0 }));
    const { error } = await supabase.from("growth_targets").upsert(rows, { onConflict: "company_id,year,month" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Saved ${year} targets`);
    onSaved();
  }

  async function fillAll() {
    const raw = await promptDialog({
      title: `Fill every month of ${year}`,
      label: "Monthly amount",
      defaultValue: "0",
    });
    if (raw == null) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount)) return toast.error("Enter a number");
    const v: Record<number, string> = {};
    for (const t of targets) v[t.month] = String(amount);
    setValues(v);
    toast.info("Filled — remember to save the year");
  }

  async function spreadAnnual() {
    const raw = await promptDialog({
      title: `Spread an annual total across ${year}`,
      description: "Divided evenly across the months, with the remainder added to the last month.",
      label: "Annual total",
      defaultValue: "0",
    });
    if (raw == null) return;
    const total = Number(raw);
    if (!Number.isFinite(total)) return toast.error("Enter a number");
    const months = targets.map((t) => t.month).sort((a: number, b: number) => a - b);
    if (!months.length) return;
    const per = Math.round((total / months.length) * 100) / 100;
    const v: Record<number, string> = {};
    months.forEach((m, i) => {
      v[m] = String(i === months.length - 1 ? Math.round((total - per * (months.length - 1)) * 100) / 100 : per);
    });
    setValues(v);
    toast.info("Spread — remember to save the year");
  }

  const yearTotal = targets.reduce((s, t) => s + (Number(values[t.month] ?? t.amount) || 0), 0);
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{year} monthly targets</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Total: {formatMoney(yearTotal)}</span>
          <Button size="sm" variant="outline" onClick={fillAll}>Fill all</Button>
          <Button size="sm" variant="outline" onClick={spreadAnnual}>Spread annual</Button>
          <Button size="sm" onClick={saveAll} disabled={saving}>{saving ? "Saving…" : "Save year"}</Button>
          <Button size="sm" variant="ghost" onClick={onRemove} aria-label={`Remove ${year}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {targets.map((t) => (
            <div key={t.id}>
              <div className="text-xs text-muted-foreground mb-1">{MONTHS[t.month - 1]}</div>
              <Input type="number" value={values[t.month] ?? ""} onChange={(e) => setValues({ ...values, [t.month]: e.target.value })} className="h-9" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


type BacklogRow = { id?: string; year: number; month: number; amount: number; stream: string };

function BacklogEditor({ year, months, allRows, onSaved }: {
  year: number; months: number[]; allRows: BacklogRow[]; onSaved: () => void;
}) {
  // values keyed by `${stream}::${month}`
  const [values, setValues] = useState<Record<string, string>>({});
  const [streams, setStreams] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newStream, setNewStream] = useState("");

  useEffect(() => {
    const existing = Array.from(new Set(allRows.map((r) => r.stream || "Default")));
    const list = existing.length ? existing : ["Default"];
    setStreams(list);
    const v: Record<string, string> = {};
    for (const r of allRows) v[`${r.stream || "Default"}::${r.month}`] = String(r.amount);
    setValues(v);
  }, [allRows]);

  async function saveAll() {
    setSaving(true);
    const payload: any[] = [];
    for (const stream of streams) {
      for (const m of months) {
        const existing = allRows.find((r) => r.month === m && (r.stream || "Default") === stream);
        const amount = Number(values[`${stream}::${m}`] ?? existing?.amount ?? 0) || 0;
        payload.push({
          ...(existing?.id ? { id: existing.id } : {}),
          year, month: m, stream, amount,
        });
      }
    }
    const { error } = await supabase.from("booked_backlog").upsert(payload, { onConflict: "company_id,year,month,stream", defaultToNull: false });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Saved ${year} booked backlog`);
    onSaved();
  }

  function addStream() {
    const name = newStream.trim();
    if (!name) return;
    if (streams.includes(name)) return toast.error("Stream already exists");
    setStreams([...streams, name]);
    setNewStream("");
  }

  async function deleteStream(stream: string) {
    if (streams.length <= 1) return toast.error("At least one stream required");
    if (!(await confirmDialog(`Delete stream "${stream}" for ${year}?`))) return;
    const ids = allRows.filter((r) => (r.stream || "Default") === stream).map((r) => r.id).filter(Boolean) as string[];
    if (ids.length) {
      const { error } = await supabase.from("booked_backlog").delete().in("id", ids);
      if (error) return toast.error(error.message);
    }
    setStreams(streams.filter((s) => s !== stream));
    onSaved();
  }

  async function renameStream(stream: string) {
    const name = await promptDialog({
      title: `Rename stream "${stream}"`,
      label: "Stream name",
      defaultValue: stream,
      confirmLabel: "Rename",
    });
    if (!name || name === stream) return;
    if (streams.includes(name)) return toast.error("Stream name already exists");
    const ids = allRows.filter((r) => (r.stream || "Default") === stream).map((r) => r.id).filter(Boolean) as string[];
    if (ids.length) {
      const { error } = await supabase.from("booked_backlog").update({ stream: name }).in("id", ids);
      if (error) return toast.error(error.message);
    }
    setStreams(streams.map((s) => (s === stream ? name : s)));
    setValues((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const [s, m] = k.split("::");
        next[`${s === stream ? name : s}::${m}`] = v;
      }
      return next;
    });
    toast.success(`Renamed to "${name}"`);
    onSaved();
  }

  const yearTotal = streams.reduce((sum, s) =>
    sum + months.reduce((mSum, m) => mSum + (Number(values[`${s}::${m}`]) || 0), 0), 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-2">
        <CardTitle className="text-base">{year} booked backlog</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total: {formatMoney(yearTotal)}</span>
          <Button size="sm" onClick={saveAll} disabled={saving}>{saving ? "Saving…" : "Save year"}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {streams.map((stream) => {
          const streamTotal = months.reduce((s, m) => s + (Number(values[`${stream}::${m}`]) || 0), 0);
          return (
            <div key={stream} className="border rounded-md p-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="text-sm font-medium">{stream}</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatMoney(streamTotal)}</span>
                  <Button size="sm" variant="ghost" onClick={() => renameStream(stream)}>Rename</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteStream(stream)}>Delete</Button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {months.map((m) => (
                  <div key={m}>
                    <div className="text-xs text-muted-foreground mb-1">{MONTHS[m - 1]}</div>
                    <Input type="number" value={values[`${stream}::${m}`] ?? ""}
                      onChange={(e) => setValues({ ...values, [`${stream}::${m}`]: e.target.value })}
                      className="h-9" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 pt-1">
          <Input placeholder="New product line / value stream" value={newStream}
            onChange={(e) => setNewStream(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStream(); } }}
            className="h-9 max-w-xs" />
          <Button size="sm" variant="outline" onClick={addStream}>Add stream</Button>
          <span className="text-xs text-muted-foreground">Remember to click "Save year" after editing.</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MultiFilter({ label, options, selected, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const summary = selected.length === 0 ? "All" : selected.length === 1
    ? (options.find((o) => o.value === selected[0])?.label ?? "1 selected")
    : `${selected.length} selected`;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant={selected.length ? "default" : "outline"} className="h-8 gap-1" disabled={options.length === 0}>
          <span className="text-xs">{label}: <span className="font-normal">{summary}</span></span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-2">
        <div className="max-h-64 overflow-y-auto space-y-1">
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <label key={o.value} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted cursor-pointer">
                <Checkbox checked={checked}
                  onCheckedChange={() => onChange(checked ? selected.filter((v) => v !== o.value) : [...selected, o.value])} />
                <span className="truncate">{o.label}</span>
              </label>
            );
          })}
        </div>
        {selected.length > 0 && (
          <Button size="sm" variant="ghost" className="mt-1 w-full h-7 text-xs" onClick={() => onChange([])}>Clear</Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
