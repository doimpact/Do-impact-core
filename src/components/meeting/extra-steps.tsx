import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, EmptyLine, StatTile, d, num } from "@/components/meeting/ui";

/* ---------------- Strategy ---------------- */

export function HoshinStep() {
  const q = useQuery({
    queryKey: ["m-hoshin"],
    queryFn: async () => (await supabase.from("hoshin_items").select("*").is("archived_at", null).order("sort_order")).data ?? [],
  });
  const items = (q.data ?? []) as any[];
  const kinds = ["long_term", "annual", "priority", "kpi"] as const;
  const label: Record<string, string> = { long_term: "Long-term", annual: "Annual", priority: "Priorities", kpi: "KPIs" };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">X-matrix line-up: are the annual objectives and priorities still the right ones?</p>
      <div className="grid grid-cols-4 gap-3">
        {kinds.map((k) => (
          <StatTile key={k} label={label[k]!} value={String(items.filter((i) => i.kind === k).length)} />
        ))}
      </div>
      <DataTable
        head={["Type", "Item", "Target", "Current", "Horizon"]}
        rows={items.slice(0, 14).map((i) => [label[i.kind] ?? i.kind, i.title, num(i.target_value), num(i.current_value), i.horizon ?? "—"])}
        empty="No Hoshin items defined."
      />
    </div>
  );
}

export function ProgressStep() {
  const oQ = useQuery({
    queryKey: ["m-prog-obj"],
    queryFn: async () => (await supabase.from("strategic_objectives").select("*").is("archived_at", null)).data ?? [],
  });
  const iQ = useQuery({
    queryKey: ["m-prog-init"],
    queryFn: async () => (await supabase.from("initiatives").select("*").is("archived_at", null)).data ?? [],
  });
  const objs = (oQ.data ?? []) as any[];
  const init = (iQ.data ?? []) as any[];
  const atRisk = objs.filter((o) => o.status === "at_risk").length;
  const done = objs.filter((o) => o.status === "done").length;
  const stages = ["L0", "L1", "L2", "L3", "L4", "L5"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatTile label="Objectives" value={String(objs.length)} />
        <StatTile label="At risk" value={String(atRisk)} tone={atRisk ? "#dc2626" : "#16a34a"} />
        <StatTile label="Done" value={String(done)} tone="#16a34a" />
        <StatTile label="Workstream items" value={String(init.length)} />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {stages.map((s) => (
          <div key={s} className="rounded-lg border border-border bg-background p-3 text-center">
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="text-2xl font-bold">{init.filter((i) => (i.current_stage ?? "L0") === s).length}</div>
          </div>
        ))}
      </div>
      <DataTable
        head={["Objective", "Status", "Stage", "Year"]}
        rows={objs.slice(0, 12).map((o) => [o.title, (o.status ?? "—").replace("_", " "), o.stage ?? "—", o.horizon_year ?? "—"])}
        empty="No strategic objectives."
      />
    </div>
  );
}

export function ConsolidationStep() {
  const pQ = useQuery({
    queryKey: ["m-cons-p"],
    queryFn: async () => (await supabase.from("consolidation_projects").select("*").is("archived_at", null)).data ?? [],
  });
  const phQ = useQuery({
    queryKey: ["m-cons-ph"],
    queryFn: async () => (await supabase.from("consolidation_phases").select("*")).data ?? [],
  });
  const ps = (pQ.data ?? []) as any[];
  const phases = (phQ.data ?? []) as any[];
  const openPhases = phases.filter((p) => p.status !== "done");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Projects" value={String(ps.length)} />
        <StatTile label="Phases open" value={String(openPhases.length)} tone={openPhases.length ? "#f59e0b" : "#16a34a"} />
        <StatTile label="Phases done" value={String(phases.length - openPhases.length)} tone="#16a34a" />
      </div>
      <DataTable
        head={["Project", "From", "To", "Go-live", "Status"]}
        rows={ps.map((p) => [p.name, [p.from_site_a, p.from_site_b].filter(Boolean).join(" + ") || "—", p.to_site ?? "—", d(p.target_go_live), p.status ?? "—"])}
        empty="No consolidation projects."
      />
    </div>
  );
}

export function CapexStep() {
  const q = useQuery({
    queryKey: ["m-capex"],
    queryFn: async () => (await supabase.from("capex_projects").select("*").is("archived_at", null).order("total_cost", { ascending: false })).data ?? [],
  });
  const ps = (q.data ?? []) as any[];
  const spend = ps.reduce((s, p) => s + Number(p.total_cost ?? 0), 0);
  const committed = ps.reduce((s, p) => s + Number(p.committed_cost ?? 0), 0);
  const red = ps.filter((p) => p.health === "red").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatTile label="Projects" value={String(ps.length)} />
        <StatTile label="Approved spend" value={num(spend)} />
        <StatTile label="Committed" value={num(committed)} />
        <StatTile label="Red health" value={String(red)} tone={red ? "#dc2626" : "#16a34a"} />
      </div>
      <DataTable
        head={["Project", "Stage", "Cost", "Payback (mo)", "Health"]}
        rows={ps.slice(0, 12).map((p) => [p.title, p.stage ?? "—", num(p.total_cost), p.payback_months ?? "—", (p.health ?? "—").toUpperCase()])}
        empty="No CapEx projects."
      />
    </div>
  );
}

/* ---------------- Commercial ---------------- */

export function AccountsStep() {
  const q = useQuery({
    queryKey: ["m-accounts"],
    queryFn: async () => (await supabase.from("accounts").select("*").is("archived_at", null)).data ?? [],
  });
  const oQ = useQuery({
    queryKey: ["m-acct-opps"],
    queryFn: async () => (await supabase.from("opportunities").select("account_id, value").eq("archived", false)).data ?? [],
  });
  const accts = (q.data ?? []) as any[];
  const opps = (oQ.data ?? []) as any[];
  const byAcct = new Map<string, number>();
  opps.forEach((o) => byAcct.set(o.account_id, (byAcct.get(o.account_id) ?? 0) + Number(o.value ?? 0)));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Accounts" value={String(accts.length)} />
        <StatTile label="Tier A" value={String(accts.filter((a) => (a.tier ?? "").toLowerCase() === "a").length)} tone="#dc2626" />
        <StatTile label="Pipeline covered" value={String(byAcct.size)} />
      </div>
      <DataTable
        head={["Account", "Industry", "Tier", "Open pipeline"]}
        rows={accts.slice(0, 14).map((a) => [a.name, a.industry ?? "—", (a.tier ?? "—").toUpperCase(), num(byAcct.get(a.id) ?? 0)])}
        empty="No accounts."
      />
    </div>
  );
}

export function OpportunitiesStep() {
  const q = useQuery({
    queryKey: ["m-opps-full"],
    queryFn: async () => (await supabase.from("opportunities").select("*, accounts(name)").eq("archived", false).order("expected_close_date")).data ?? [],
  });
  const opps = (q.data ?? []) as any[];
  const stages = ["prospect", "proposal", "won", "lost"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {stages.map((s) => {
          const rows = opps.filter((o) => o.stage === s);
          return <StatTile key={s} label={s} value={String(rows.length)} sub={num(rows.reduce((a, o) => a + Number(o.value ?? 0), 0))} />;
        })}
      </div>
      <DataTable
        head={["Opportunity", "Account", "Stage", "Value", "Prob.", "Close"]}
        rows={opps.slice(0, 14).map((o) => [o.name, o.accounts?.name ?? "—", o.stage, num(o.value), o.probability != null ? `${o.probability}%` : "—", d(o.expected_close_date)])}
        empty="No open opportunities."
      />
    </div>
  );
}

export function ContractsStep() {
  const q = useQuery({
    queryKey: ["m-contracts"],
    queryFn: async () => (await supabase.from("contracts").select("*, accounts(name)").order("end_date")).data ?? [],
  });
  const rows = (q.data ?? []) as any[];
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 864e5);
  const expiring = rows.filter((c) => c.end_date && new Date(c.end_date) <= in90 && new Date(c.end_date) >= now);
  const active = rows.filter((c) => c.status === "active");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Contracts" value={String(rows.length)} />
        <StatTile label="Active" value={String(active.length)} tone="#16a34a" />
        <StatTile label="Expiring 90d" value={String(expiring.length)} tone={expiring.length ? "#dc2626" : "#16a34a"} />
      </div>
      <DataTable
        head={["Contract", "Account", "Status", "Value", "Ends"]}
        rows={rows.slice(0, 14).map((c) => [c.title ?? c.contract_number ?? "—", c.accounts?.name ?? "—", c.status ?? "—", num(c.value), d(c.end_date)])}
        empty="No contracts."
      />
    </div>
  );
}

export function CommercialReviewStep() {
  const qQ = useQuery({
    queryKey: ["m-quotes"],
    queryFn: async () => (await supabase.from("quotes").select("*, accounts(name)").order("expected_close_date")).data ?? [],
  });
  const bQ = useQuery({
    queryKey: ["m-backlog"],
    queryFn: async () => (await supabase.from("booked_backlog").select("*")).data ?? [],
  });
  const quotes = (qQ.data ?? []) as any[];
  const backlog = (bQ.data ?? []) as any[];
  const open = quotes.filter((q) => !["closed_won", "closed_lost"].includes(q.status ?? ""));
  const won = quotes.filter((q) => q.status === "closed_won");
  const bookedTotal = backlog.reduce((s, b: any) => s + Number(b.amount ?? b.value ?? 0), 0);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Quote pipeline and booked backlog going into the week.</p>
      <div className="grid grid-cols-4 gap-3">
        <StatTile label="Open quotes" value={String(open.length)} />
        <StatTile label="Open value" value={num(open.reduce((s, q) => s + Number(q.amount ?? 0), 0))} />
        <StatTile label="Won" value={String(won.length)} tone="#16a34a" />
        <StatTile label="Booked backlog" value={num(bookedTotal)} />
      </div>
      <DataTable
        head={["Quote", "Account", "Status", "Amount", "Close"]}
        rows={open.slice(0, 12).map((q) => [q.title ?? q.number ?? "—", q.accounts?.name ?? "—", q.status ?? "—", num(q.amount), d(q.expected_close_date)])}
        empty="No open quotes."
      />
    </div>
  );
}

/* ---------------- Operations ---------------- */

export function SchedulingStep() {
  const q = useQuery({
    queryKey: ["m-aps-wo"],
    queryFn: async () => (await supabase.from("aps_work_orders").select("*").is("archived_at", null)).data ?? [],
  });
  const wos = (q.data ?? []) as any[];
  const today = new Date();
  const zone = (due: string | null) => {
    if (!due) return "flex";
    const days = Math.round((new Date(due).getTime() - today.getTime()) / 864e5);
    if (days <= 14) return "frozen";
    if (days <= 28) return "firm";
    return "flex";
  };
  const frozen = wos.filter((w) => zone(w.due_date) === "frozen");
  const firm = wos.filter((w) => zone(w.due_date) === "firm");
  const flex = wos.filter((w) => zone(w.due_date) === "flex");
  const noKit = frozen.filter((w) => w.kit_ready === false);
  const late = wos.filter((w) => w.due_date && new Date(w.due_date) < today && w.status !== "complete");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Load across the frozen (0–2 wk), firm (2–4 wk) and flexible (4–12 wk) zones.</p>
      <div className="grid grid-cols-5 gap-3">
        <StatTile label="Frozen" value={String(frozen.length)} />
        <StatTile label="Firm" value={String(firm.length)} />
        <StatTile label="Flexible" value={String(flex.length)} />
        <StatTile label="Kit not ready" value={String(noKit.length)} tone={noKit.length ? "#dc2626" : "#16a34a"} />
        <StatTile label="Past due" value={String(late.length)} tone={late.length ? "#dc2626" : "#16a34a"} />
      </div>
      <DataTable
        head={["WO", "Part", "Qty", "Due", "Status", "Kit"]}
        rows={[...frozen, ...firm].slice(0, 12).map((w) => [w.wo_number ?? "—", w.part_number ?? "—", w.qty ?? "—", d(w.due_date), w.status ?? "—", w.kit_ready ? "ready" : "short"])}
        empty="No work orders scheduled."
      />
    </div>
  );
}

export function SupplyChainStep() {
  const sQ = useQuery({ queryKey: ["m-sc-sup"], queryFn: async () => (await supabase.from("sc_suppliers").select("*").is("archived_at", null)).data ?? [] });
  const rQ = useQuery({ queryKey: ["m-sc-risk"], queryFn: async () => (await supabase.from("sc_risks").select("*").is("archived_at", null)).data ?? [] });
  const eQ = useQuery({ queryKey: ["m-sc-esc"], queryFn: async () => (await supabase.from("sc_escalations").select("*").is("archived_at", null)).data ?? [] });
  const cQ = useQuery({ queryKey: ["m-sc-con"], queryFn: async () => (await supabase.from("sc_contracts").select("*").is("archived_at", null)).data ?? [] });
  const sup = (sQ.data ?? []) as any[];
  const risks = (rQ.data ?? []) as any[];
  const escs = (eQ.data ?? []) as any[];
  const cons = (cQ.data ?? []) as any[];
  const spend = sup.reduce((s, x) => s + Number(x.annual_spend ?? 0), 0);
  const highRisk = risks.filter((r) => r.status !== "closed" && Number(r.likelihood ?? 0) * Number(r.impact ?? 0) >= 12);
  const openEsc = escs.filter((e) => e.status !== "closed");
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 864e5);
  const expiring = cons.filter((c) => c.end_date && new Date(c.end_date) <= in90);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <StatTile label="Suppliers" value={String(sup.length)} />
        <StatTile label="Annual spend" value={num(spend)} />
        <StatTile label="High risk" value={String(highRisk.length)} tone={highRisk.length ? "#dc2626" : "#16a34a"} />
        <StatTile label="Open escalations" value={String(openEsc.length)} tone={openEsc.length ? "#f59e0b" : "#16a34a"} />
        <StatTile label="Contracts exp. 90d" value={String(expiring.length)} tone={expiring.length ? "#f59e0b" : "#16a34a"} />
      </div>
      {openEsc.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Open supplier escalations</div>
          <DataTable
            head={["Level", "Title", "Opened", "Due", "Status"]}
            rows={openEsc.slice(0, 8).map((e) => [`L${e.level_no ?? "—"}`, e.title ?? "—", d(e.opened_at), d(e.due_date), e.status ?? "—"])}
            empty="—"
          />
        </div>
      )}
      <div>
        <div className="mb-2 text-sm font-semibold">Top suppliers by spend</div>
        <DataTable
          head={["Supplier", "Country", "Spend", "Sole source", "Status"]}
          rows={[...sup].sort((a, b) => Number(b.annual_spend ?? 0) - Number(a.annual_spend ?? 0)).slice(0, 10).map((s) => [s.name, s.country ?? "—", num(s.annual_spend), s.sole_source ? "yes" : "no", s.status ?? "—"])}
          empty="No suppliers."
        />
      </div>
    </div>
  );
}

/* ---------------- Execution ---------------- */

export function ProblemSolverStep() {
  const pQ = useQuery({ queryKey: ["m-pp"], queryFn: async () => (await supabase.from("problem_plans").select("*")).data ?? [] });
  const sQ = useQuery({ queryKey: ["m-pp-steps"], queryFn: async () => (await supabase.from("problem_plan_steps").select("plan_id, status")).data ?? [] });
  const plans = (pQ.data ?? []) as any[];
  const steps = (sQ.data ?? []) as any[];
  const active = plans.filter((p) => p.status === "active");
  const blocked = steps.filter((s) => s.status === "blocked");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Plans" value={String(plans.length)} />
        <StatTile label="Active" value={String(active.length)} />
        <StatTile label="Blocked steps" value={String(blocked.length)} tone={blocked.length ? "#dc2626" : "#16a34a"} />
      </div>
      <DataTable
        head={["Problem", "Status", "Target", "Steps done"]}
        rows={plans.slice(0, 12).map((p) => {
          const mine = steps.filter((s) => s.plan_id === p.id);
          return [p.title, p.status ?? "—", d(p.target_date), `${mine.filter((s) => s.status === "done").length}/${mine.length}`];
        })}
        empty="No problem plans."
      />
    </div>
  );
}

export function A3Step() {
  const q = useQuery({ queryKey: ["m-a3"], queryFn: async () => (await supabase.from("a3_reports").select("*").order("updated_at", { ascending: false })).data ?? [] });
  const rows = (q.data ?? []) as any[];
  const active = rows.filter((r) => r.status === "active");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="A3s" value={String(rows.length)} />
        <StatTile label="Active" value={String(active.length)} tone="#f59e0b" />
        <StatTile label="Completed" value={String(rows.filter((r) => r.status === "completed").length)} tone="#16a34a" />
      </div>
      <DataTable
        head={["A3", "Status", "Problem", "Updated"]}
        rows={rows.slice(0, 12).map((r) => [r.title, r.status ?? "—", (r.problem_statement ?? "").slice(0, 70), d(r.updated_at)])}
        empty="No A3 reports."
      />
    </div>
  );
}

export function EightDStep() {
  const q = useQuery({ queryKey: ["m-8d"], queryFn: async () => (await supabase.from("eight_d_reports").select("*").is("archived_at", null).order("updated_at", { ascending: false })).data ?? [] });
  const rows = (q.data ?? []) as any[];
  const open = rows.filter((r) => !["closed", "archived"].includes(r.status ?? ""));
  const critical = rows.filter((r) => r.severity === "critical" || r.severity === "high");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="8Ds" value={String(rows.length)} />
        <StatTile label="Open" value={String(open.length)} tone={open.length ? "#f59e0b" : "#16a34a"} />
        <StatTile label="High / critical" value={String(critical.length)} tone={critical.length ? "#dc2626" : "#16a34a"} />
      </div>
      <DataTable
        head={["Ref", "Title", "Status", "Severity", "Disciplines"]}
        rows={rows.slice(0, 12).map((r) => [r.reference ?? "—", r.title, r.status ?? "—", r.severity ?? "—", `${(r.completed_disciplines ?? []).length}/9`])}
        empty="No 8D reports."
      />
    </div>
  );
}

export function MroStep() {
  const q = useQuery({ queryKey: ["m-mro"], queryFn: async () => (await supabase.from("mro_assessments").select("*").is("archived_at", null).order("created_at", { ascending: false })).data ?? [] });
  const aQ = useQuery({ queryKey: ["m-mro-a"], queryFn: async () => (await supabase.from("mro_actions").select("*")).data ?? [] });
  const rows = (q.data ?? []) as any[];
  const actions = (aQ.data ?? []) as any[];
  const openActions = actions.filter((a) => a.status !== "done");
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + Number(r.wrench_time_pct ?? 0), 0) / rows.length) : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Assessments" value={String(rows.length)} />
        <StatTile label="Avg wrench time" value={`${avg}%`} tone={avg >= 60 ? "#16a34a" : avg >= 40 ? "#f59e0b" : "#dc2626"} />
        <StatTile label="Open actions" value={String(openActions.length)} tone={openActions.length ? "#f59e0b" : "#16a34a"} />
      </div>
      <DataTable
        head={["Assessment", "Aircraft", "Check", "Wrench time"]}
        rows={rows.slice(0, 10).map((r) => [r.title, r.aircraft_type ?? "—", r.check_type ?? "—", r.wrench_time_pct != null ? `${r.wrench_time_pct}%` : "—"])}
        empty="No MRO assessments."
      />
    </div>
  );
}

/* ---------------- People ---------------- */

export function DevelopmentStep() {
  const dQ = useQuery({ queryKey: ["m-dev"], queryFn: async () => (await supabase.from("development_plans").select("*, employees(first_name, last_name), skills(name)")).data ?? [] });
  const rows = (dQ.data ?? []) as any[];
  const open = rows.filter((r) => r.status !== "done");
  const today = new Date();
  const overdue = open.filter((r) => r.target_date && new Date(r.target_date) < today);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Plans" value={String(rows.length)} />
        <StatTile label="In progress" value={String(open.length)} />
        <StatTile label="Overdue" value={String(overdue.length)} tone={overdue.length ? "#dc2626" : "#16a34a"} />
      </div>
      <DataTable
        head={["Employee", "Skill", "Now → target", "Due", "Status"]}
        rows={rows.slice(0, 12).map((r) => [
          r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "—",
          r.skills?.name ?? "—",
          `${r.current_level ?? "—"} → ${r.target_level ?? "—"}`,
          d(r.target_date),
          r.status ?? "—",
        ])}
        empty="No development plans."
      />
    </div>
  );
}

export function LeadershipStep() {
  const eQ = useQuery({ queryKey: ["m-lead-emp"], queryFn: async () => (await supabase.from("employees").select("id, first_name, last_name, job_title, department, manager_id, status").is("archived_at", null)).data ?? [] });
  const emp = (eQ.data ?? []) as any[];
  const managers = new Set(emp.map((e) => e.manager_id).filter(Boolean));
  const noManager = emp.filter((e) => !e.manager_id);
  const byDept = new Map<string, number>();
  emp.forEach((e) => byDept.set(e.department ?? "Unassigned", (byDept.get(e.department ?? "Unassigned") ?? 0) + 1));
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Leadership span and organisation coverage.</p>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Headcount" value={String(emp.length)} />
        <StatTile label="Leaders" value={String(managers.size)} />
        <StatTile label="No manager set" value={String(noManager.length)} tone={noManager.length ? "#f59e0b" : "#16a34a"} />
      </div>
      <DataTable
        head={["Department", "People"]}
        rows={[...byDept.entries()].map(([dept, n]) => [dept, String(n)])}
        empty="No employees recorded."
      />
      {!emp.length && <EmptyLine text="Add employees under People to populate this step." />}
    </div>
  );
}
