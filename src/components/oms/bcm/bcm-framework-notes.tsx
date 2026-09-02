import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Block = { id: string; title: string; body: React.ReactNode };

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function Checks({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-1 sm:grid-cols-2">
      {items.map((i) => (
        <li key={i}>☐ {i}</li>
      ))}
    </ul>
  );
}

function Template({ title, fields }: { title: string; fields: string[] }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="mt-1.5 grid gap-0.5 text-sm sm:grid-cols-2">
        {fields.map((f) => (
          <li key={f} className="text-muted-foreground">
            {f}: <span className="text-foreground">______</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BLOCKS: Block[] = [
  {
    id: "purpose",
    title: "Purpose, policy and scope",
    body: (
      <div className="space-y-3">
        <p>
          The BCM program ensures the company can protect employees, maintain critical operations, serve customers,
          protect assets and recover quickly following a major disruption.
        </p>
        <p className="font-medium">
          Protect people → stabilize → continue critical operations → communicate → recover → learn → improve.
        </p>
        <p>The company will:</p>
        <List
          items={[
            "Protect employee and visitor safety first.",
            "Identify critical business processes and risks.",
            "Establish recovery priorities and recovery times.",
            "Maintain contingency plans for critical equipment, suppliers, people, facilities and IT systems.",
            "Maintain appropriate emergency supplies and critical spare parts.",
            "Maintain backup communication and information systems.",
            "Train employees with continuity responsibilities.",
            "Conduct periodic exercises.",
            "Review and improve the program after disruptions and exercises.",
          ]}
        />
        <p className="text-muted-foreground">
          Safety, environmental, legal, regulatory and quality requirements always take priority over production.
        </p>
        <p className="font-medium">Scope</p>
        <p className="text-muted-foreground">
          Manufacturing, maintenance, engineering, quality, supply chain, warehouse, IT, HR, finance, facilities,
          sales/customer service and critical contractors and suppliers.
        </p>
        <p className="font-medium">Major risks</p>
        <p className="text-muted-foreground">
          Fire · earthquake · severe weather/flood · extended power or utility outage · major equipment failure ·
          facility loss · cyberattack/ransomware · IT outage · critical supplier failure · material shortage ·
          transportation disruption · labor shortage · loss of key personnel · major quality event · environmental
          incident · security incident.
        </p>
      </div>
    ),
  },
  {
    id: "responsibilities",
    title: "Responsibilities and priorities",
    body: (
      <div className="space-y-3">
        <dl className="space-y-2">
          {[
            ["Site leader / general manager", "Owns the program, activates the plan, sets priorities, allocates resources, makes major recovery decisions."],
            ["BCM coordinator / Operations / EHS", "Maintains the program, risk assessments and plans; coordinates exercises; maintains contacts; tracks corrective actions."],
            ["Operations", "Identifies critical production processes, sets production recovery priorities, develops alternate production strategies."],
            ["Maintenance / Engineering", "Identifies critical equipment, maintains critical spares and service contacts, develops equipment recovery plans."],
            ["Supply chain", "Identifies critical suppliers, establishes alternate sources and inventory strategies."],
            ["IT", "Protects critical systems and data, maintains backups, maintains recovery procedures."],
            ["Quality", "Controls affected product, determines inspection/release requirements, approves restart when necessary."],
            ["HR", "Maintains employee contacts, supports staffing and cross-training."],
            ["All employees", "Follow emergency instructions, report disruptions immediately, protect themselves and others, follow continuity procedures."],
          ].map(([role, duty]) => (
            <div key={role}>
              <dt className="font-medium">{role}</dt>
              <dd className="text-muted-foreground">{duty}</dd>
            </div>
          ))}
        </dl>
        <p className="font-medium">Priority order when an event occurs</p>
        <ol className="list-decimal space-y-0.5 pl-5 text-muted-foreground">
          {[
            "Life safety",
            "Emergency response",
            "Environmental protection",
            "Stabilize the facility",
            "Protect critical assets",
            "Protect product / customer property",
            "Maintain critical operations",
            "Communicate with employees, customers and suppliers",
            "Restore normal operations",
            "Capture lessons learned",
          ].map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="font-medium">Business continuity team</p>
        <p className="text-muted-foreground">
          Incident commander/site leader, operations, EHS/safety, maintenance/engineering, quality, supply chain, IT,
          HR, finance and communications. Not every member is required for every event.
        </p>
      </div>
    ),
  },
  {
    id: "strategies",
    title: "Continuity strategies",
    body: (
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Equipment", ["Preventive maintenance", "Critical spare parts", "Backup equipment", "Alternate machines", "Outside processing", "Emergency repair agreements"]],
          ["Suppliers", ["Dual sourcing", "Approved alternate suppliers", "Safety stock", "Alternate materials where approved", "Supplier risk monitoring"]],
          ["People", ["Cross-training", "Skills matrix", "Backup personnel", "Contractors / temporary labor"]],
          ["Facility", ["Alternate work areas", "Alternate warehouse", "Emergency power where justified", "Backup utilities"]],
          ["IT", ["Regular backups", "Off-site / cloud backups", "Recovery procedures", "Cybersecurity controls", "Alternate communications", "Manual procedures"]],
          ["Production", ["Alternate machines", "Alternate processes", "Overtime", "Outside processing", "Alternate manufacturing location", "Production prioritization"]],
        ].map(([title, items]) => (
          <div key={title as string}>
            <div className="font-medium">{title as string}</div>
            <List items={items as string[]} />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "playbooks",
    title: "Response playbooks",
    body: (
      <div className="space-y-4">
        <div>
          <div className="font-medium">Critical equipment failure</div>
          <ol className="list-decimal space-y-0.5 pl-5 text-muted-foreground">
            {[
              "Protect personnel and safely stop the equipment; apply LOTO when required.",
              "Notify maintenance; determine the failure and estimate repair time.",
              "Check spare parts; contact the service provider.",
              "Identify alternate equipment or process; evaluate outside processing.",
              "Prioritize production and communicate customer impact.",
              "Repair, test, and have Quality validate production.",
              "Resume normal operation and complete the root-cause review.",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        <div>
          <div className="font-medium">IT / cyber disruption</div>
          <ol className="list-decimal space-y-0.5 pl-5 text-muted-foreground">
            {[
              "Determine whether cybersecurity may be involved; notify IT/cybersecurity.",
              "Do not reconnect potentially compromised systems without authorization; preserve evidence as directed.",
              "Identify affected systems and activate manual procedures.",
              "Determine backup availability and prioritize system recovery.",
              "Verify data integrity, restore systems, validate business processes.",
              "Document lessons learned.",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-1 text-muted-foreground">
            Critical systems may include ERP, production scheduling, quality systems, engineering systems,
            manufacturing systems, file servers, email and timekeeping.
          </p>
        </div>
        <div>
          <div className="font-medium">Manual operations plan</div>
          <p className="text-muted-foreground">
            For each critical process record: normal IT system, manual backup, paper form, responsible person, maximum
            manual operating period, whether data re-entry is required and who approves. Typical manual processes:
            production travelers, inventory, receiving, shipping, quality inspection, maintenance work orders,
            production scheduling and employee communication.
          </p>
        </div>
        <div>
          <div className="font-medium">Facility loss</div>
          <ol className="list-decimal space-y-0.5 pl-5 text-muted-foreground">
            {[
              "Protect employees and account for personnel; contact emergency services if required.",
              "Secure the facility and assess damage.",
              "Protect inventory and customer property.",
              "Contact landlord and insurance.",
              "Determine alternate facility and warehouse.",
              "Establish a temporary production strategy and communicate with customers.",
              "Establish a recovery timeline.",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <Template
            title="Alternate facility assessment"
            fields={[
              "Location",
              "Available space",
              "Power",
              "Water",
              "Compressed air",
              "HVAC",
              "Internet",
              "Loading dock",
              "Manufacturing equipment",
              "Warehouse",
              "Employee access",
              "Transportation",
              "Regulatory requirements",
              "Security",
              "Estimated setup time",
              "Estimated cost",
              "Production capacity",
              "Required modifications",
              "Approved for use?",
            ]}
          />
        </div>
        <div>
          <div className="font-medium">Production prioritization</div>
          <p className="text-muted-foreground">
            When capacity is limited, prioritize on safety, critical customer requirements, contractual commitments,
            required ship dates, customer criticality, revenue impact, available material, available capacity and
            quality status — with a named approver.
          </p>
          <Template
            title="Production recovery plan"
            fields={[
              "Affected process",
              "Normal capacity",
              "Current capacity",
              "Required capacity",
              "Critical customers",
              "Critical products",
              "Available equipment",
              "Alternate equipment",
              "Alternate process",
              "Available personnel",
              "Material constraints",
              "Quality constraints",
              "Expected recovery time",
              "Recovery actions",
              "Owner",
              "Target date",
              "Restart approval required",
              "Approved by",
            ]}
          />
        </div>
        <div>
          <div className="font-medium">Quality continuity</div>
          <p className="text-muted-foreground">
            After a disruption Quality determines whether equipment needs requalification, calibration was affected,
            material was compromised, environmental conditions affected product, process parameters changed, inspection
            equipment is functional, additional inspection is required or product must be quarantined. Affected product
            is not released until required checks are complete.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "communication",
    title: "Communication plan and templates",
    body: (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="font-medium">Internal</div>
            <List items={["Employees", "Supervisors", "Management", "Contractors"]} />
          </div>
          <div>
            <div className="font-medium">External</div>
            <List
              items={[
                "Customers",
                "Suppliers",
                "Emergency services",
                "Utilities",
                "Insurance",
                "Landlord",
                "Government / regulators",
                "Critical service providers",
              ]}
            />
          </div>
        </div>
        <p className="text-muted-foreground">
          Only designated personnel communicate externally during major events. Do not promise recovery dates until
          Operations has validated them.
        </p>
        <Template
          title="Employee communication"
          fields={["Event", "Date/time", "What happened", "What employees need to do", "Work status", "Reporting location", "Next update", "Contact", "Additional instructions"]}
        />
        <Template
          title="Customer communication"
          fields={["Customer", "Date/time", "Event", "Current impact", "Orders/products affected", "Actions being taken", "Estimated recovery", "Next update", "Customer contact"]}
        />
        <Template
          title="Supplier communication"
          fields={["Supplier", "Date/time", "Event", "Material/service affected", "Current inventory", "Expected supply impact", "Required supplier action", "Alternate source", "Expected recovery", "Next update", "Supplier contact"]}
        />
      </div>
    ),
  },
  {
    id: "recovery",
    title: "Return to normal and post-incident review",
    body: (
      <div className="space-y-3">
        <div className="font-medium">Return-to-normal checklist</div>
        <Checks
          items={[
            "Emergency conditions resolved",
            "Facility safe",
            "Equipment inspected",
            "Required repairs complete",
            "Utilities stable",
            "IT systems validated",
            "Quality requirements satisfied",
            "Materials available",
            "Staffing adequate",
            "Customer commitments reviewed",
            "Backlog assessed",
            "Employees informed",
            "Temporary controls documented",
            "Root cause initiated where appropriate",
            "Lessons learned captured",
          ]}
        />
        <div className="font-medium">Post-incident review questions</div>
        <List
          items={[
            "What happened and what was the business impact?",
            "What worked and what failed?",
            "Were responsibilities clear and did communication work?",
            "Were employees prepared and were backups effective?",
            "Were alternate suppliers and resources available?",
            "Did recovery meet the target?",
            "What should change and what corrective actions are required?",
          ]}
        />
        <p className="text-muted-foreground">Every action needs an owner and a due date.</p>
      </div>
    ),
  },
  {
    id: "audit",
    title: "Audit checklist, annual review and 90-day implementation",
    body: (
      <div className="space-y-4">
        <div>
          <div className="font-medium">BCM audit checklist</div>
          <Checks
            items={[
              "BCM policy current",
              "Responsibilities defined",
              "Contact list current",
              "Critical processes identified",
              "BIA completed",
              "Recovery objectives established",
              "Risk register current",
              "High risks have mitigation plans",
              "Critical suppliers identified",
              "Alternate suppliers considered",
              "Critical equipment identified",
              "Spare parts identified",
              "Critical skills identified",
              "Cross-training completed",
              "Critical IT systems identified",
              "Backups functioning",
              "Recovery procedures documented",
              "Recovery tested",
              "Facility contingency considered",
              "Communication plans current",
              "Exercise completed",
              "Corrective actions closed",
            ]}
          />
        </div>
        <div>
          <div className="font-medium">Annual review</div>
          <Checks
            items={[
              "Review policy",
              "Update BIA",
              "Review top risks",
              "Review critical equipment",
              "Review suppliers",
              "Review critical personnel",
              "Review IT recovery",
              "Review facility recovery",
              "Update contact lists",
              "Conduct exercise",
              "Review lessons learned",
              "Close corrective actions",
              "Update recovery strategies",
              "Obtain management approval",
            ]}
          />
        </div>
        <div>
          <div className="font-medium">90-day implementation</div>
          <div className="mt-1 grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-sm font-semibold">Days 1–30 — Foundation</div>
              <List
                items={[
                  "Approve BCM policy and assign an owner",
                  "Establish the BCM team",
                  "Identify top 10 risks",
                  "Identify critical processes, equipment, suppliers, skills and IT systems",
                  "Establish contacts and the activation process",
                ]}
              />
            </div>
            <div>
              <div className="text-sm font-semibold">Days 31–60 — Build</div>
              <List
                items={[
                  "Complete BIAs and establish RTOs/RPOs",
                  "Develop equipment recovery plans and supplier contingencies",
                  "Establish cross-training priorities",
                  "Verify IT backups and recovery",
                  "Establish manual procedures, production prioritization and communication templates",
                ]}
              />
            </div>
            <div>
              <div className="text-sm font-semibold">Days 61–90 — Test</div>
              <List
                items={[
                  "Conduct a tabletop exercise",
                  "Test critical IT recovery and emergency communications",
                  "Test a critical machine failure scenario",
                  "Identify gaps, assign corrective actions, update plans",
                  "Report results to leadership",
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "contacts",
    title: "Master plan, contacts and document control",
    body: (
      <div className="space-y-3">
        <div className="font-medium">The controlled BCM plan contains</div>
        <p className="text-muted-foreground">
          Purpose and scope · policy · roles and responsibilities · activation process · business impact analysis · risk
          register · critical process recovery plans · critical equipment recovery · supplier continuity ·
          personnel/skills continuity · IT/cyber recovery · facility recovery · communications · production
          prioritization · quality recovery · return to normal · exercises · post-incident review · emergency contacts ·
          document control.
        </p>
        <Template
          title="Master contact list"
          fields={[
            "Site leader",
            "BCM coordinator",
            "EHS",
            "Operations",
            "Maintenance",
            "Engineering",
            "Quality",
            "Supply chain",
            "IT",
            "HR",
            "Finance",
            "Communications",
            "Emergency services",
            "Electricity",
            "Gas",
            "Water",
            "Internet / telephone",
            "IT / cybersecurity",
            "Fire protection",
            "Security",
            "Landlord",
            "Insurance",
            "Insurance broker",
            "Critical equipment vendor",
            "Critical equipment service",
            "Critical supplier",
            "Alternate supplier",
            "Transportation",
            "Key customer",
            "Legal",
          ]}
        />
        <Template title="Document control" fields={["Document", "Owner", "Approved by", "Version", "Effective date", "Next review date"]} />
        <p className="text-muted-foreground">
          The goal is not paperwork. The goal is that when the power goes out, a critical machine fails, the ERP is
          down, a major supplier cannot ship, the building becomes unavailable or a cyberattack occurs, the company
          knows who is in charge, what happens first, which operations are critical, how long it can operate without
          them, what alternatives exist, who to contact, how to recover and how to return to normal.
        </p>
      </div>
    ),
  },
];

export function BcmFrameworkNotes() {
  return (
    <div className="rounded-xl border">
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold">Business continuity management program</h3>
        <p className="text-sm text-muted-foreground">
          The written program behind the checklist — policy, responsibilities, strategies, playbooks, templates and the
          implementation path.
        </p>
      </div>
      <Accordion type="multiple" className="px-4">
        {BLOCKS.map((b) => (
          <AccordionItem key={b.id} value={b.id}>
            <AccordionTrigger className="text-left">{b.title}</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">{b.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
