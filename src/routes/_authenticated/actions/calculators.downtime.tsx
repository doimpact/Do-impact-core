import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { computeDowntime, num, type ValueBasis } from "@/lib/calculators";
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

export const Route = createFileRoute("/_authenticated/actions/calculators/downtime")({
  head: () => ({ meta: [{ title: "Downtime cost calculator — DO.Impact" }] }),
  component: DowntimeCalculator,
});

function DowntimeCalculator() {
  const prefs = useNumberFormat();
  const [valueBasis, setValueBasis] = useState<ValueBasis>("constrained");
  const [unitsPerHour, setUnits] = useState(60);
  const [contributionPerUnit, setContribution] = useState(18);
  const [labourCostPerHour, setLabour] = useState(220);
  const [fixedCostPerHour, setFixed] = useState(150);
  const [downtimeMinutesPerWeek, setDowntime] = useState(300);
  const [weeksPerYear, setWeeks] = useState(48);

  const r = useMemo(
    () =>
      computeDowntime({
        unitsPerHour,
        contributionPerUnit,
        labourCostPerHour,
        fixedCostPerHour,
        downtimeMinutesPerWeek,
        weeksPerYear,
        valueBasis,
      }),
    [
      unitsPerHour,
      contributionPerUnit,
      labourCostPerHour,
      fixedCostPerHour,
      downtimeMinutesPerWeek,
      weeksPerYear,
      valueBasis,
    ],
  );

  const money = (n: number) => formatMoney(n, prefs);
  const constrained = r.valueBasis === "constrained";

  return (
    <CalcShell
      title="Downtime cost"
      intro="What an unplanned stop actually costs once you count idle labour, fixed cost that keeps running, and — if you are sold out — the margin you never made."
    >
      <CalcGrid>
        <CalcInputs>
          <BasisToggle value={valueBasis} onChange={setValueBasis} label="How do you value the lost time?" />
          <NumField label="Units per hour when running" value={unitsPerHour} onChange={setUnits} />
          {constrained ? (
            <NumField label="Contribution margin per unit" value={contributionPerUnit} onChange={setContribution} />
          ) : null}
          <NumField label="Idle labour cost per hour" value={labourCostPerHour} onChange={setLabour} step={10} />
          <NumField label="Fixed / overhead cost per hour" value={fixedCostPerHour} onChange={setFixed} step={10} />
          <NumField
            label="Unplanned downtime per week"
            value={downtimeMinutesPerWeek}
            onChange={setDowntime}
            suffix="min"
            step={10}
          />
          <NumField label="Operating weeks per year" value={weeksPerYear} onChange={setWeeks} suffix="wk" />
        </CalcInputs>

        <CalcResults headline={money(r.costPerMinute)} headlineLabel="Cost per minute of downtime" tone="warn">
          <Row label="Cost per hour" value={money(r.costPerHour)} />
          <Row label="Cost per week" value={money(r.weeklyCost)} />
          <Row label="Cost per year" value={money(r.annualCost)} />
          <Row label="Hours lost per year" value={`${num(r.annualHoursLost, 0)} h`} />
          <Row
            label="Units not made"
            value={`${num(r.unitsLostPerYear, 0)} pcs/yr`}
            hint={constrained ? undefined : "Recoverable later — not counted as lost margin"}
          />
          <AssumptionNote
            text={
              constrained
                ? `Includes ${money(r.lostMarginPerHour)}/h of lost contribution margin, because the line is sold out and the units are never recovered.`
                : "Lost margin is excluded: with spare capacity the units get made later, so only idle labour and fixed cost are truly burnt."
            }
          />
        </CalcResults>
      </CalcGrid>

      <NextStep
        text="Downtime is only fixable when the reasons are captured at the machine, in the moment. Log stops on the shop floor view and Pareto them weekly."
        to="/oms/shopfloor"
        cta="Open Shop Floor"
      />
    </CalcShell>
  );
}
