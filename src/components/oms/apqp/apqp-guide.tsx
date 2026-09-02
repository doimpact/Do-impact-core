import { APQP_PHASES, APQP_VS_AS9145, PPAP_LEVELS } from "@/lib/apqp";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ApqpGuide() {
  return (
    <Accordion type="single" collapsible className="rounded-lg border px-4">
      <AccordionItem value="guide" className="border-none">
        <AccordionTrigger className="text-sm font-semibold">
          Process guide — how APQP works and when to use it
        </AccordionTrigger>
        <AccordionContent className="space-y-6 text-sm pb-4">
          <div>
            <h3 className="font-semibold mb-2">The five phases (concurrent, not strictly sequential)</h3>
            <ol className="space-y-2">
              {APQP_PHASES.map((p) => (
                <li key={p.phase} className="rounded-md border p-3">
                  <p className="font-medium">Phase {p.phase} — {p.name}</p>
                  <p className="text-muted-foreground mt-1">{p.purpose}</p>
                  <p className="mt-1"><span className="font-medium">Exit:</span> {p.exit}</p>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-muted-foreground">
              Phases overlap in practice — process design starts before product design is frozen. Keep the checklist
              honest rather than strictly ordered: a phase is "done" when its exit criteria are met.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">APQP vs AS9145 — which one do I use?</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="p-2 font-medium">Topic</th>
                    <th className="p-2 font-medium">APQP</th>
                    <th className="p-2 font-medium">AS9145 (NPI tab)</th>
                  </tr>
                </thead>
                <tbody>
                  {APQP_VS_AS9145.map((r) => (
                    <tr key={r.topic} className="border-t">
                      <td className="p-2 font-medium">{r.topic}</td>
                      <td className="p-2">{r.apqp}</td>
                      <td className="p-2">{r.as9145}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-muted-foreground">
              Simple rule: follow the customer. If they ask for PPAP, run APQP here. If they ask for AS9145 or
              AS9102 FAI, run the NPI framework on the first tab.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">PPAP submission levels</h3>
            <ul className="space-y-1">
              {PPAP_LEVELS.map((l) => (
                <li key={l.level} className="flex gap-2">
                  <span className="font-medium shrink-0 w-16">{l.label}</span>
                  <span className="text-muted-foreground">{l.desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-muted-foreground">
              Level 3 is the default unless the customer says otherwise. Phase 4 of the checklist tracks all 18 PPAP
              elements, ending with the Part Submission Warrant (PSW).
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Good practice</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Start the PFMEA (Phase 3) while design is still maturing — link it to this program so evidence stays in one place.</li>
              <li>Review phase exit criteria in your weekly NPI/launch meeting, not in a silo.</li>
              <li>Record evidence on each deliverable as you go — reconstructing it the week before PPAP is painful.</li>
              <li>When the program ships, run Phase 5 honestly: capture lessons learned into Problem Solver so the next launch is easier.</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
