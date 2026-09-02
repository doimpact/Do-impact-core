import type { ReactNode } from "react";
import { CONTROL_LEVELS, LIKELIHOOD_SCALE, SEVERITY_SCALE, riskBand } from "@/lib/safety";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((i) => <li key={i}>{i}</li>)}
    </ul>
  );
}

/** Narrative reference material shown under the Safety checklist. */
export function SafetyFrameworkNotes() {
  return (
    <div className="space-y-4">
      <Block title="Purpose & core cycle">
        <p className="text-muted-foreground">
          Prevent injuries, illnesses, equipment damage, fires and environmental releases; find hazards before they cause
          harm; give every employee a simple way to report; make safety visible and measurable; make sure corrective
          actions are assigned, completed and verified; build ownership; and reduce risk continuously through engineering,
          administrative and behavioural controls.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
{`IDENTIFY → ASSESS → CONTROL → REPORT → CORRECT → VERIFY → LEARN → PREVENT RECURRENCE`}
        </pre>
      </Block>

      <Block title="Roles & responsibilities">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="font-medium">Site leader / GM</div>
            <List items={[
              "Set safety expectations and review performance monthly.",
              "Provide resources for corrective actions.",
              "Hold leaders accountable for overdue actions.",
              "Participate in safety walks and reinforce stop-work authority.",
            ]} />
          </div>
          <div>
            <div className="font-medium">EHS / safety manager</div>
            <List items={[
              "Own the management system and regulatory compliance.",
              "Facilitate risk assessments and lead investigations.",
              "Track corrective actions and analyse trends.",
              "Train employees and report performance to leadership.",
            ]} />
          </div>
          <div>
            <div className="font-medium">Supervisors / managers</div>
            <List items={[
              "Observe, correct unsafe conditions immediately where possible.",
              "Run toolbox talks and required inspections.",
              "Investigate near misses and minor events.",
              "Close corrective actions and coach safe work practices.",
            ]} />
          </div>
          <div>
            <div className="font-medium">Employees — the site's hazard-detection system</div>
            <List items={[
              "Report hazards and near misses.",
              "Follow procedures and use required PPE.",
              "Stop and ask when conditions change.",
              "Use stop-work authority when there is immediate danger.",
            ]} />
          </div>
        </div>
      </Block>

      <Block title="Risk matrix — Risk = Severity × Likelihood">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="font-medium">Severity</div>
            <ul className="mt-1 space-y-1">
              {SEVERITY_SCALE.map((s) => <li key={s.n}><span className="font-mono">{s.n}</span> — {s.label}</li>)}
            </ul>
          </div>
          <div>
            <div className="font-medium">Likelihood</div>
            <ul className="mt-1 space-y-1">
              {LIKELIHOOD_SCALE.map((s) => <li key={s.n}><span className="font-mono">{s.n}</span> — {s.label}</li>)}
            </ul>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[3, 7, 12, 20].map((score) => {
            const b = riskBand(score);
            return (
              <div key={b.key} className="flex items-start gap-2 rounded-lg border p-2">
                <Badge className={cn("border-0", b.className)}>{b.label}</Badge>
                <span className="text-xs text-muted-foreground">{b.action}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Thresholds should be calibrated to your site's hazards and applicable regulatory requirements.
        </p>
      </Block>

      <Block title="Hierarchy of controls">
        <ol className="space-y-1">
          {CONTROL_LEVELS.map((c) => <li key={c.key}><span className="font-medium">{c.label}</span> — {c.hint}</li>)}
        </ol>
        <p className="text-muted-foreground">
          Always ask “can we engineer this hazard out?” before “let's train people to be careful.”
        </p>
      </Block>

      <Block title="Corrective action rules">
        <List items={[
          "No owner = no action.",
          "No due date = no accountability.",
          "No verification = not closed.",
          "Never close a finding just because someone says the work is done — verify the control works.",
        ]} />
        <p className="text-muted-foreground">
          Example: SAF-2026-014 · Safety walk · Exposed pinch point · High · Area barricaded → install engineered guard ·
          Maintenance Manager · due 15 Sep · verified by EHS.
        </p>
      </Block>

      <Block title="Near miss & incident investigation">
        <p className="text-muted-foreground">Treat near misses as free lessons. For each event ask:</p>
        <List items={[
          "What happened, and what could have happened?",
          "Why did it happen, and what prevented a worse outcome?",
          "What control should change?",
          "Could this happen somewhere else in the facility?",
        ]} />
        <p className="text-muted-foreground">
          Avoid investigations that end at “employee failed to follow procedure”. Was the procedure available, practical
          and trained? Was the machine different? Was production pressure involved? Was supervision adequate? Were
          engineering controls available? Had the hazard been reported before?
        </p>
      </Block>

      <Block title="Operating rhythm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="font-medium">Weekly</div>
            <List items={[
              "Monday — open actions, high-risk items, last week's incidents, planned high-risk work.",
              "Tue–Thu — walks, observations, JSAs, hazard corrections, toolbox talks.",
              "Friday — new hazards, near misses, completed and overdue actions, lessons communicated.",
            ]} />
          </div>
          <div>
            <div className="font-medium">Monthly / quarterly / annual</div>
            <List items={[
              "W1 leadership safety review · W2 focused risk assessment · W3 management walk · W4 trend analysis.",
              "Quarterly deep review of compliance, incidents, training, guarding, LOTO, emergency preparedness and culture.",
              "Annual strategy: review last year, rank top risks, set objectives, build a roadmap, communicate it.",
            ]} />
          </div>
        </div>
      </Block>

      <Block title="Escalation">
        <List items={[
          "Level 1 — immediate correction by employee or supervisor (blocked exit → clear it).",
          "Level 2 — department corrective action needing maintenance, engineering or management.",
          "Level 3 — high-risk: stop or restrict work, interim controls, notify EHS, formal assessment, permanent engineering fix.",
          "Level 4 — critical, uncontrolled imminent danger: STOP WORK. Restart only when controlled and documented.",
        ]} />
      </Block>

      <Block title="Culture stages">
        <List items={[
          "Reactive — we investigate after someone gets hurt.",
          "Compliant — we follow rules because we have to.",
          "Proactive — we identify and control hazards before someone gets hurt.",
          "Interdependent — everyone owns safety and actively protects one another.",
        ]} />
        <p className="text-muted-foreground">The goal is to move the site toward proactive and interdependent.</p>
      </Block>

      <Block title="Digital safety workflow">
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
{`Employee reports hazard
  ↓ supervisor / EHS notified
  ↓ immediate risk assessment
  ↓ immediate control if required
  ↓ corrective action created — owner + due date
  ↓ action completed
  ↓ effectiveness verified
  ↓ finding closed
  ↓ trend analysed → lesson communicated → similar areas checked`}
        </pre>
        <p className="text-muted-foreground">
          Every reported hazard has a visible path from discovery to verified closure.
        </p>
      </Block>

      <Block title="First 90 days">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="font-medium">Days 1–30 — establish control</div>
            <List items={["Responsibilities, reporting process, risk matrix", "Corrective-action tracker and dashboard", "Daily/weekly walks and stop-work expectations", "Top 10 site risks identified"]} />
          </div>
          <div>
            <div className="font-medium">Days 31–60 — build the system</div>
            <List items={["High-risk JSAs, safety committee, training matrix", "Near-miss programme and management walks", "Investigation process and effectiveness verification", "Start trend analysis"]} />
          </div>
          <div>
            <div className="font-medium">Days 61–90 — improve</div>
            <List items={["Baseline audit and repeat findings", "Focused risk assessments", "Top 3 risk-reduction projects", "Annual objectives and first formal management review"]} />
          </div>
        </div>
      </Block>

      <div className="rounded-xl border-l-4 border-red-500 bg-red-500/5 p-5">
        <div className="text-sm font-semibold text-red-700 dark:text-red-400">Five non-negotiable rules</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>Every employee can report a hazard.</li>
          <li>Every employee has stop-work authority for imminent danger.</li>
          <li>Every significant finding has an owner and a due date.</li>
          <li>An action is not closed until effectiveness is verified.</li>
          <li>We manage the highest potential consequence — not just the number of injuries.</li>
        </ol>
        <p className="mt-3 text-sm text-muted-foreground">
          The objective is not a site with lots of safety paperwork. It is a site where hazards are found early, employees
          feel comfortable reporting them, leaders respond quickly, risks are engineered down, and the organisation learns
          before someone gets hurt.
        </p>
      </div>
    </div>
  );
}
