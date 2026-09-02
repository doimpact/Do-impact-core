import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { computeCopq, pct } from "@/lib/calculators";
import { formatMoney, useNumberFormat } from "@/lib/number-format";
import { CalcShell, CalcGrid, CalcInputs, CalcResults, NumField, Row, NextStep } from "@/components/actions/calculator-ui";

export const Route = createFileRoute("/_authenticated/actions/calculators/copq")({
  head: () => ({ meta: [{ title: "Cost of poor quality calculator — DO.Impact" }] }),
  component: CopqCalculator,
});

function CopqCalculator() {
  const prefs = useNumberFormat();
  const [annualRevenue, setRevenue] = useState(8000000);
  const [scrap, setScrap] = useState(120000);
  const [rework, setRework] = useState(90000);
  const [warranty, setWarranty] = useState(45000);
  const [sortingInspection, setSorting] = useState(60000);
  const [expediteFreight, setExpedite] = useState(35000);
  const [concessionsCredits, setConcessions] = useState(20000);

  const r = useMemo(
    () =>
      computeCopq({
        annualRevenue,
        scrap,
        rework,
        warranty,
        sortingInspection,
        expediteFreight,
        concessionsCredits,
      }),
    [annualRevenue, scrap, rework, warranty, sortingInspection, expediteFreight, concessionsCredits],
  );

  const money = (n: number) => formatMoney(n, prefs);

  return (
    <CalcShell
      title="Cost of poor quality"
      intro="Everything you pay because the process was not right first time — added up, and shown as a share of revenue."
    >
      <CalcGrid>
        <CalcInputs>
          <NumField label="Annual revenue" value={annualRevenue} onChange={setRevenue} step={10000} />
          <NumField label="Scrap (material + labour)" value={scrap} onChange={setScrap} step={1000} />
          <NumField label="Rework" value={rework} onChange={setRework} step={1000} />
          <NumField label="Warranty & returns" value={warranty} onChange={setWarranty} step={1000} />
          <NumField label="Sorting & extra inspection" value={sortingInspection} onChange={setSorting} step={1000} />
          <NumField label="Expedite & premium freight" value={expediteFreight} onChange={setExpedite} step={1000} />
          <NumField label="Concessions & credits" value={concessionsCredits} onChange={setConcessions} step={1000} />
        </CalcInputs>

        <CalcResults
          headline={money(r.total)}
          headlineLabel="Cost of poor quality per year"
          tone={r.pctOfRevenue > 0.03 ? "warn" : "default"}
        >
          <Row label="Share of revenue" value={pct(r.pctOfRevenue, 2)} />
          <Row label="Per month" value={money(r.perMonth)} />
          {r.lines.map((l) => (
            <Row key={l.label} label={l.label} value={`${money(l.value)} · ${pct(l.share, 0)}`} />
          ))}
        </CalcResults>
      </CalcGrid>

      <NextStep
        text={
          r.lines[0] && r.lines[0].value > 0
            ? `${r.lines[0].label} is your largest single cost. Run a structured 8D on the top defect driving it — that is where the payback is.`
            : "Enter your quality costs to see which bucket to attack first."
        }
        to="/actions/problem-solver/eight-d"
        cta="Start an 8D"
      />
    </CalcShell>
  );
}
