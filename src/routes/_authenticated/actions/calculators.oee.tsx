import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { computeOee, pct, num } from "@/lib/calculators";
import { CalcShell, CalcGrid, CalcInputs, CalcResults, NumField, Row, NextStep } from "@/components/actions/calculator-ui";

export const Route = createFileRoute("/_authenticated/actions/calculators/oee")({
  head: () => ({ meta: [{ title: "OEE calculator — DO.Impact" }] }),
  component: OeeCalculator,
});

function OeeCalculator() {
  const [plannedMinutes, setPlanned] = useState(480);
  const [downtimeMinutes, setDowntime] = useState(60);
  const [idealCycleSeconds, setCycle] = useState(30);
  const [totalUnits, setUnits] = useState(700);
  const [rejectUnits, setRejects] = useState(25);

  const r = useMemo(
    () => computeOee({ plannedMinutes, downtimeMinutes, idealCycleSeconds, totalUnits, rejectUnits }),
    [plannedMinutes, downtimeMinutes, idealCycleSeconds, totalUnits, rejectUnits],
  );

  const worst =
    r.worstLoss === "availability"
      ? "Your biggest loss is availability — the machine is stopped. Track the stop reasons on a daily SQDP board and attack the top one."
      : r.worstLoss === "performance"
        ? "Your biggest loss is performance — the machine runs, but slower than its ideal cycle. Micro-stops and speed loss are usually hiding here."
        : r.worstLoss === "quality"
          ? "Your biggest loss is quality — you are paying for time that produced scrap. A structured 8D on the top defect pays back fastest."
          : "Enter a shift to see where the loss sits.";

  return (
    <CalcShell
      title="OEE calculator"
      intro="Overall Equipment Effectiveness for one asset over one shift: availability x performance x quality."
    >
      <CalcGrid>
        <CalcInputs>
          <NumField label="Planned production time" value={plannedMinutes} onChange={setPlanned} suffix="min" />
          <NumField label="Unplanned downtime" value={downtimeMinutes} onChange={setDowntime} suffix="min" />
          <NumField label="Ideal cycle time" value={idealCycleSeconds} onChange={setCycle} suffix="sec" />
          <NumField label="Total units produced" value={totalUnits} onChange={setUnits} suffix="pcs" />
          <NumField label="Reject / rework units" value={rejectUnits} onChange={setRejects} suffix="pcs" />
        </CalcInputs>

        <CalcResults
          headline={pct(r.oee)}
          headlineLabel="Overall Equipment Effectiveness"
          tone={r.oee >= 0.85 ? "good" : r.oee < 0.6 ? "warn" : "default"}
        >
          <Row label="Availability" value={pct(r.availability)} hint={`${num(r.runMinutes, 0)} min actually running`} />
          <Row label="Performance" value={pct(r.performance)} hint="Ideal output vs actual output while running" />
          <Row label="Quality" value={pct(r.quality)} hint={`${num(r.goodUnits, 0)} good units`} />
          <Row label="Lost to stops" value={`${num(r.lostMinutesAvailability, 0)} min`} />
          <Row label="Lost to speed" value={`${num(r.lostMinutesPerformance, 0)} min`} />
          <Row label="Lost to defects" value={`${num(r.lostMinutesQuality, 0)} min`} />
        </CalcResults>
      </CalcGrid>

      <NextStep text={worst} to="/oms/daily" cta="Open the daily SQDP board" />
    </CalcShell>
  );
}
