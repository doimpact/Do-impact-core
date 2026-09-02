import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { computeChangeover, pct, num, type ValueBasis } from "@/lib/calculators";
import { formatMoney, useNumberFormat } from "@/lib/number-format";
import {
  CalcShell,
  CalcGrid,
  CalcInputs,
  CalcResults,
  NumField,
  Row,
  NextStep,
  BasisToggle,
  AssumptionNote,
} from "@/components/actions/calculator-ui";

export const Route = createFileRoute("/_authenticated/actions/calculators/changeover")({
  head: () => ({ meta: [{ title: "Changeover / SMED savings calculator — DO.Impact" }] }),
  component: ChangeoverCalculator,
});

function ChangeoverCalculator() {
  const prefs = useNumberFormat();
  const [valueBasis, setValueBasis] = useState<ValueBasis>("constrained");
  const [currentMinutes, setCurrent] = useState(90);
  const [targetMinutes, setTarget] = useState(30);
  const [changeoversPerWeek, setPerWeek] = useState(15);
  const [weeksPerYear, setWeeks] = useState(48);
  const [unitsPerHour, setUnits] = useState(60);
  const [contributionPerUnit, setContribution] = useState(18);
  const [avoidedCostPerHour, setAvoided] = useState(220);

  const r = useMemo(
    () =>
      computeChangeover({
        currentMinutes,
        targetMinutes,
        changeoversPerWeek,
        weeksPerYear,
        unitsPerHour,
        contributionPerUnit,
        valueBasis,
        avoidedCostPerHour,
      }),
    [
      currentMinutes,
      targetMinutes,
      changeoversPerWeek,
      weeksPerYear,
      unitsPerHour,
      contributionPerUnit,
      valueBasis,
      avoidedCostPerHour,
    ],
  );

  const money = (n: number) => formatMoney(n, prefs);
  const constrained = r.valueBasis === "constrained";

  return (
    <CalcShell
      title="Changeover / SMED savings"
      intro="What a shorter changeover is worth: recovered running hours, and the money those hours actually bring in."
    >
      <CalcGrid>
        <CalcInputs>
          <BasisToggle value={valueBasis} onChange={setValueBasis} />
          <NumField label="Current changeover time" value={currentMinutes} onChange={setCurrent} suffix="min" />
          <NumField label="Target changeover time" value={targetMinutes} onChange={setTarget} suffix="min" />
          <NumField label="Changeovers per week" value={changeoversPerWeek} onChange={setPerWeek} />
          <NumField label="Operating weeks per year" value={weeksPerYear} onChange={setWeeks} suffix="wk" />
          <NumField label="Units per hour when running" value={unitsPerHour} onChange={setUnits} />
          {constrained ? (
            <NumField label="Contribution margin per unit" value={contributionPerUnit} onChange={setContribution} />
          ) : (
            <NumField
              label="Avoided labour / overtime per hour"
              value={avoidedCostPerHour}
              onChange={setAvoided}
              step={10}
            />
          )}
        </CalcInputs>

        <CalcResults headline={money(r.annualValue)} headlineLabel="Annual value of the reduction" tone="good">
          <Row label="Saved per changeover" value={`${num(r.minutesSavedEach, 0)} min`} />
          <Row label="Reduction" value={pct(r.reductionPct, 0)} />
          <Row label="Hours recovered per year" value={`${num(r.hoursRecoveredPerYear, 0)} h`} />
          <Row
            label={constrained ? "Extra units per year" : "Capacity freed per year"}
            value={`${num(r.extraUnitsPerYear, 0)} pcs`}
            hint={constrained ? undefined : "Available, but not counted as revenue"}
          />
          <AssumptionNote
            text={
              constrained
                ? `Valued at ${money(contributionPerUnit)} contribution margin per unit, because the line is sold out and every recovered hour turns into units you can sell.`
                : `Valued as avoided cost at ${money(avoidedCostPerHour)}/h, because you cannot sell more output. The freed capacity is real, but it is not revenue until demand exists.`
            }
          />
        </CalcResults>
      </CalcGrid>

      <NextStep
        text="SMED starts by separating internal work (machine stopped) from external work (machine running). Film one changeover and work it as a structured improvement."
        to="/actions/problem-solver/a3"
        cta="Open an A3"
      />
    </CalcShell>
  );
}
