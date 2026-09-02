import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABEL, STAGE_PROB, OPEN_STAGES, formatMoney } from "@/lib/csar";
import { formatDistanceToNow } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PillarEngagementPanel } from "@/components/people/pillar-engagement-panel";


const OPP_STAGES = ["prospect", "proposal", "won", "lost"] as const;
const OPP_STAGE_LABEL: Record<(typeof OPP_STAGES)[number], string> = {
  prospect: "Prospect", proposal: "Proposal", won: "Won", lost: "Lost",
};

export const Route = createFileRoute("/_authenticated/commercial/")({
  head: () => ({ meta: [{ title: "Commercial — DO.Impact" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["c-dashboard-stats"],
    queryFn: async () => {
      const { data: quotes } = await supabase.from("quotes").select("amount, status, delivery_date, expected_close_date");
      const [{ count: accounts }, { count: contacts }] = await Promise.all([
        supabase.from("accounts").select("*", { count: "exact", head: true }),
        supabase.from("contacts").select("*", { count: "exact", head: true }),
      ]);
      const open = (quotes ?? []).filter((q) => OPEN_STAGES.includes(q.status as never));
      const openTotal = open.reduce((s, q) => s + Number(q.amount || 0), 0);
      const weighted = open.reduce((s, q) => s + Number(q.amount || 0) * (STAGE_PROB[q.status] ?? 0), 0);
      const now = new Date();
      const in12 = new Date(now.getFullYear(), now.getMonth() + 12, 1);
      const backlog12 = (quotes ?? [])
        .filter((q) => ["approved", "closed_won"].includes(q.status) && q.delivery_date && new Date(q.delivery_date) >= now && new Date(q.delivery_date) < in12)
        .reduce((s, q) => s + Number(q.amount || 0), 0);
      const byStage: Record<string, { count: number; total: number }> = {};
      for (const q of quotes ?? []) {
        byStage[q.status] ??= { count: 0, total: 0 };
        byStage[q.status].count += 1;
        byStage[q.status].total += Number(q.amount || 0);
      }
      return { accounts: accounts ?? 0, contacts: contacts ?? 0, openTotal, weighted, backlog12, byStage };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["c-recent-interactions"],
    queryFn: async () => {
      const { data } = await supabase.from("interactions")
        .select("id, type, subject, occurred_at, account_id, accounts(name)")
        .order("occurred_at", { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  const { data: oppByStage } = useQuery({
    queryKey: ["c-opps-by-stage"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("stage, value");
      const map: Record<string, { stage: string; label: string; count: number; value: number }> = {};
      for (const s of OPP_STAGES) map[s] = { stage: s, label: OPP_STAGE_LABEL[s], count: 0, value: 0 };
      for (const o of data ?? []) {
        const s = (o.stage as string) in map ? (o.stage as keyof typeof map) : null;
        if (!s) continue;
        map[s].count += 1;
        map[s].value += Number(o.value || 0);
      }
      return OPP_STAGES.map((s) => map[s]);
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Commercial & Growth</h1>
        <p className="text-sm text-muted-foreground">Where the team stands today.</p>
      </header>
      <PillarEngagementPanel pillar="commercial" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Accounts" value={stats?.accounts ?? 0} />
        <Kpi label="Contacts" value={stats?.contacts ?? 0} />
        <Kpi label="Open pipeline" value={formatMoney(stats?.openTotal ?? 0)} />
        <Kpi label="Weighted pipeline" value={formatMoney(stats?.weighted ?? 0)} accent />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Quote pipeline by stage</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {OPEN_STAGES.concat(["closed_won", "closed_lost"]).map((s) => {
              const row = stats?.byStage?.[s] ?? { count: 0, total: 0 };
              return (
                <div key={s} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{STAGE_LABEL[s]}</Badge>
                    <span className="text-muted-foreground">{row.count} quote{row.count === 1 ? "" : "s"}</span>
                  </div>
                  <div className="font-medium">{formatMoney(row.total)}</div>
                </div>
              );
            })}
            <div className="pt-2 text-sm text-muted-foreground">
              Backlog (approved / won, next 12 months): <span className="font-medium text-foreground">{formatMoney(stats?.backlog12 ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(recent ?? []).length === 0 && (<div className="text-sm text-muted-foreground">No interactions logged yet.</div>)}
            {(recent ?? []).map((r) => (
              <Link key={r.id} to="/commercial/accounts/$id" params={{ id: r.account_id }} className="block hover:bg-muted rounded p-2 -mx-2 transition-colors">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="capitalize">{r.type}</Badge>
                  <span>{formatDistanceToNow(new Date(r.occurred_at), { addSuffix: true })}</span>
                </div>
                <div className="text-sm font-medium mt-0.5 truncate">{r.subject || "(no subject)"}</div>
                <div className="text-xs text-muted-foreground truncate">{(r.accounts as unknown as { name: string } | null)?.name}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Opportunities by stage</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={oppByStage ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Opportunity value by stage</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={oppByStage ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatMoney(Number(v))} width={80} />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold mt-1 ${accent ? "text-accent" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
