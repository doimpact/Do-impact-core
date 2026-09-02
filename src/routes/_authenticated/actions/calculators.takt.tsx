import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { computeTakt, pct, num } from "@/lib/calculators";
import { CalcShell, CalcGrid, CalcInputs, CalcResults, NumField, Row, NextStep } from "@/components/actions/calculator-ui";

export const Route = createFileRoute("/_authenticated/actions/calculators/takt")({
  head: () => ({ meta: [{ title: "Takt time calculator — DO.Impact" }] }),
  component: TaktCalculator,
});

function TaktCalculator() {
  const [shiftMinutes, setShift] = useState(480);
  const [breakMinutes, setBreaks] = useState(45);
  const [shiftsPerDay, setShifts] = useState(2);
  const [demandPerDay, setDemand] = useState(320);
  const [totalWorkContentSeconds, setWork] = useState(420);
  const [actualCycleSeconds, setActual] = useState(150);

  const r = useMemo(
    () =>
      computeTakt({
        shiftMinutes,
        breakMinutes,
        shiftsPerDay,
        demandPerDay,
        totalWorkContentSeconds,
        actualCycleSeconds,
      }),
    [shiftMinutes, breakMinutes, shiftsPerDay, demandPerDay, totalWorkContentSeconds, actualCycleSeconds],
  );

  return (
    <CalcShell
      title="Takt time & cycle time"
      intro="How fast the line has to run to meet customer demand, and whether today's cycle time gets you there."
    >
      <CalcGrid>
        <CalcInputs>
          <NumField label="Shift length" value={shiftMinutes} onChange={setShift} suffix="min" />
          <NumField label="Breaks & meetings per shift" value={breakMinutes} onChange={setBreaks} suffix="min" />
          <NumField label="Shifts per day" value={shiftsPerDay} onChange={setShifts} suffix="x" />
          <NumField label="Customer demand per day" value={demandPerDay} onChange={setDemand} suffix="pcs" />
          <NumField label="Total work content" value={totalWorkContentSeconds} onChange={setWork} suffix="sec" />
          <NumField label="Actual cycle time" value={actualCycleSeconds} onChange={setActual} suffix="sec" />
        </CalcInputs>

        <CalcResults
          headline={`${num(r.taktSeconds, 1)} sec`}
          headlineLabel="Takt time — one unit must leave the line this often"
          tone={r.meetsDemand ? "good" : "warn"}
        >
          <Row label="Available time" value={`${num(r.availableMinutes, 0)} min/day`} />
          <Row
            label="Operators required"
            value={num(r.operatorsRequired, 2)}
            hint="Work content divided by takt — round up to the next whole person"
          />
          <Row label="Capacity at current cycle" value={`${num(r.capacityPerDay, 0)} pcs/day`} />
          <Row label="Line utilisation vs takt" value={pct(r.utilisation)} />
          <Row
            label="Meets demand?"
            value={r.meetsDemand ? "Yes" : "No"}
            hint={r.meetsDemand ? "Cycle time is inside takt" : "Cycle time is longer than takt — you will fall behind every day"}
          />
        </CalcResults>
      </CalcGrid>

      <NextStep
        text="Once you know takt, the constraint is usually a single station. Map the line and load each station against takt."
        to="/oms/scheduling"
        cta="Open scheduling (0–12 weeks)"
      />
    </CalcShell>
  );
}
