import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Download, FileText, Loader2 } from "lucide-react";

import { useActiveCompany } from "@/hooks/use-companies";
import { useFrameworkEntries, useFrameworkRows } from "@/hooks/use-industrial-strategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateBoardPdf } from "@/lib/board-pdf";
import { generateBoardPptx } from "@/lib/board-pptx";
import { assignIds, type Block } from "@/lib/board-report-blocks";
import {
  DEFAULT_ISF_SECTIONS,
  ISF_SECTIONS,
  buildIndustrialStrategyPages,
  type IsfSectionId,
} from "@/lib/industrial-strategy-report";

export const Route = createFileRoute("/_authenticated/report/industrial-strategy")({
  head: () => ({
    meta: [
      { title: "Industrial Strategy summary — DO.Impact" },
      {
        name: "description",
        content:
          "A presentation-ready summary of the Industrial Strategy Framework: cascade, where to play, how we win, capabilities, portfolio, initiatives and cockpit.",
      },
      { property: "og:title", content: "Industrial Strategy summary — DO.Impact" },
      {
        property: "og:description",
        content: "Export the industrial strategy as a board-ready PDF or PowerPoint pack.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndustrialStrategyReportPage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function IndustrialStrategyReportPage() {
  const { data: active } = useActiveCompany();
  const companyName = active?.companies?.name ?? "Company";

  const now = useMemo(() => new Date(), []);
  const [periodLabel, setPeriodLabel] = useState(format(now, "MMMM yyyy"));
  const [headline, setHeadline] = useState("");
  const [sections, setSections] = useState<Record<IsfSectionId, boolean>>({ ...DEFAULT_ISF_SECTIONS });
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pptxBusy, setPptxBusy] = useState(false);

  const { data: entries = [], isLoading: le } = useFrameworkEntries();
  const { data: rows = [], isLoading: lr } = useFrameworkRows();
  const loading = le || lr;

  const pages = useMemo(
    () =>
      assignIds(
        buildIndustrialStrategyPages({
          companyName,
          periodLabel,
          generatedOn: now,
          entries,
          rows,
          sections,
          headline,
        }),
      ),
    [companyName, periodLabel, now, entries, rows, sections, headline],
  );

  async function exportPdf() {
    setPdfBusy(true);
    try {
      await generateBoardPdf({
        companyName,
        periodLabel,
        pages,
        generatedOn: now,
        fileName: `${companyName.replace(/\s+/g, "_")}_Industrial_Strategy_${format(now, "yyyy-MM-dd")}.pdf`,
      });
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setPdfBusy(false);
    }
  }

  async function exportPptx() {
    setPptxBusy(true);
    try {
      await generateBoardPptx({
        companyName,
        periodLabel,
        pages,
        fileName: `${companyName.replace(/\s+/g, "_")}_Industrial_Strategy_${format(now, "yyyy-MM-dd")}.pptx`,
      });
      toast.success("PowerPoint downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PowerPoint");
    } finally {
      setPptxBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link to="/report/board" className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50">
          Full board pack
        </Link>
        <Link to="/report/owner" className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50">
          Owner dashboard
        </Link>
        <Link to="/report/business-health" className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50">
          Business health
        </Link>
        <span className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          Industrial Strategy
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Industrial Strategy summary</h1>
          <p className="text-sm text-muted-foreground">
            A presentation-ready pack built from everything captured in Strategy Foundation →{" "}
            <Link to="/strategy" className="underline underline-offset-2">
              Industrial Strategy Framework
            </Link>
            . Sections with no saved content are skipped automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-9 w-40"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            aria-label="Period label"
          />
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={pdfBusy || loading}>
            {pdfBusy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Download className="mr-1.5 size-4" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportPptx} disabled={pptxBusy || loading}>
            {pptxBusy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <FileText className="mr-1.5 size-4" />}
            PowerPoint
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Executive summary</h2>
            <Textarea
              rows={4}
              className="mt-2"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="The one paragraph the board should remember — where the strategy stands and what happens next."
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sections</h2>
            <div className="mt-2 space-y-1">
              {ISF_SECTIONS.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={sections[s.id]}
                    onChange={() => setSections((c) => ({ ...c, [s.id]: !c[s.id] }))}
                  />
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Slide preview · {pages.length} slides
          </h2>
          {loading && <p className="text-sm text-muted-foreground">Loading the framework…</p>}
          {!loading && pages.length <= 1 && (
            <p className="text-sm text-muted-foreground">
              Nothing captured yet — fill in the Industrial Strategy Framework and it will appear here.
            </p>
          )}
          <div className="space-y-4">
            {pages.map((page, idx) => (
              <div key={page.id ?? idx} className="mx-auto w-full max-w-[720px] overflow-hidden rounded-lg bg-white text-black shadow-md">
                {page.dark ? (
                  <div className="relative flex aspect-[16/9] flex-col justify-center overflow-hidden bg-[#171b21] p-10 text-white">
                    <div className="absolute left-0 top-1/2 h-1.5 w-24 -translate-y-24 bg-[#e85d3a]" />
                    <div className="absolute bottom-16 right-10 h-1 w-32 bg-[#e85d3a]" />
                    <div className="text-[10px] font-bold tracking-[0.3em] text-neutral-400">INDUSTRIAL STRATEGY</div>
                    <div className="mt-4 text-3xl font-bold leading-tight">{companyName}</div>
                    <div className="mt-2 text-lg font-medium text-[#e85d3a]">{periodLabel}</div>
                    <div className="mt-3 text-xs text-neutral-300">Strategy on a page — market, product, plant, capital</div>
                    <div className="mt-auto flex items-end justify-between text-[10px]">
                      <div className="text-neutral-400">Generated {now.toLocaleDateString()}</div>
                      <div className="font-semibold text-white">DO.Impact Operating System</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-8 text-[11px]">
                    {page.blocks.map((b, i) => (
                      <SlideBlock key={b.id ?? i} block={b} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideBlock({ block: b }: { block: Block }) {
  if (b.type === "h1")
    return (
      <div className="mb-2 flex items-stretch overflow-hidden rounded bg-[#171b21] text-white">
        <div className="w-1 bg-[#e85d3a]" />
        <div className="flex-1 px-3 py-2">
          <div className="text-sm font-bold leading-tight">{b.text}</div>
          {b.sub && <div className="mt-0.5 text-[9px] text-neutral-300">{b.sub}</div>}
        </div>
      </div>
    );
  if (b.type === "h2")
    return (
      <div className="pt-1">
        <div className="text-[12px] font-semibold text-neutral-900">{b.text}</div>
        <div className="mt-0.5 h-[2px] w-6 bg-[#e85d3a]" />
      </div>
    );
  if (b.type === "p") return <div className="whitespace-pre-wrap text-[11px] leading-relaxed text-neutral-700">{b.text}</div>;
  if (b.type === "note")
    return (
      <div className="flex items-stretch overflow-hidden rounded border border-neutral-200 bg-neutral-50">
        <div className="w-1 bg-[#e85d3a]" />
        <div className="flex-1 px-2.5 py-2">
          {b.title && <div className="text-[11px] font-semibold text-neutral-900">{b.title}</div>}
          <div className="whitespace-pre-wrap text-[11px] text-neutral-700">{b.text}</div>
        </div>
      </div>
    );
  if (b.type === "stats")
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(b.items.length, 1)}, minmax(0, 1fr))` }}>
        {b.items.map((it, ii) => (
          <div key={ii} className="flex items-stretch overflow-hidden rounded border border-neutral-200 bg-neutral-50">
            <div className="w-1" style={{ background: it.color ?? "#e85d3a" }} />
            <div className="flex-1 px-2 py-1.5">
              <div className="text-[8px] font-semibold uppercase tracking-wider text-neutral-500">{it.label}</div>
              <div className="text-sm font-bold text-neutral-900">{it.value}</div>
            </div>
          </div>
        ))}
      </div>
    );
  if (b.type === "table") {
    const ryg = b.rygColumns ?? [];
    const cell = (val: string, ci: number) => {
      if (!ryg.includes(ci)) return "";
      const v = val.toLowerCase();
      if (v.startsWith("red")) return "bg-red-500 text-white font-bold text-center";
      if (v.startsWith("yel")) return "bg-amber-500 text-white font-bold text-center";
      if (v.startsWith("gre")) return "bg-emerald-500 text-white font-bold text-center";
      return "";
    };
    return (
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr>
            {b.head.map((h, hi) => (
              <th key={hi} className="border border-neutral-300 bg-[#171b21] px-1.5 py-1 text-left font-semibold text-white">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {b.rows.map((r, ri) => (
            <tr key={ri} className={ri % 2 ? "bg-neutral-50" : ""}>
              {r.map((c, ci) => (
                <td key={ci} className={`border border-neutral-200 px-1.5 py-1 align-top ${cell(String(c), ci)}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return null;
}
