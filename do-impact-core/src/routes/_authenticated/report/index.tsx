import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, CalendarDays, Users, Network, Gauge, Activity, Compass } from "lucide-react";

import { useExecRoomAddon } from "@/hooks/use-exec-room";

export const Route = createFileRoute("/_authenticated/report/")({
  head: () => ({
    meta: [
      { title: "Reports & meetings — DO.Impact" },
      {
        name: "description",
        content:
          "Board pack, weekly leadership review and the AI Exec Team Room in one place.",
      },
      { property: "og:title", content: "Reports & meetings — DO.Impact" },
      {
        property: "og:description",
        content: "Board pack, weekly leadership review and the AI Exec Team Room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportIndex,
});

function AddonCard({
  to,
  icon: Icon,
  title,
  body,
  expired,
}: {
  to: "/report/team-room" | "/report/enterprise-network";
  icon: typeof Users;
  title: string;
  body: string;
  expired: boolean;
}) {
  if (expired) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5">
        <Icon className="size-5 text-muted-foreground" />
        <h2 className="mt-3 font-medium text-muted-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        <p className="mt-3 text-xs font-medium text-amber-600">
          Add-on expired —{" "}
          <Link to="/billing" className="underline">
            renew to unlock
          </Link>
        </p>
      </div>
    );
  }
  return (
    <Link to={to} className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50">
      <Icon className="size-5 text-primary" />
      <h2 className="mt-3 font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}

function ReportIndex() {
  const { isActive, isExpired } = useExecRoomAddon();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Reports & meetings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything you need to report out — monthly to the board, weekly with the site leadership
        team.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/report/board"
          className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50"
        >
          <FileText className="size-5 text-primary" />
          <h2 className="mt-3 font-medium">Board report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build and export the monthly board pack as PDF or PowerPoint.
          </p>
        </Link>
        <Link
          to="/report/owner"
          className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50"
        >
          <Gauge className="size-5 text-primary" />
          <h2 className="mt-3 font-medium">Owner dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The short board view — money, growth, delivery, cash, people, risk and value.
          </p>
        </Link>

        <Link
          to="/report/business-health"
          className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50"
        >
          <Activity className="size-5 text-primary" />
          <h2 className="mt-3 font-medium">Business health review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Financial health plus the four pillars — pick your measures, add commentary, export.
          </p>
        </Link>

        <Link
          to="/report/industrial-strategy"
          className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50"
        >
          <Compass className="size-5 text-primary" />
          <h2 className="mt-3 font-medium">Industrial Strategy</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A presentation-ready summary of the Industrial Strategy Framework — cascade, choices, portfolio, cockpit.
          </p>
        </Link>





        <Link
          to="/meeting/weekly"
          className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50"
        >
          <CalendarDays className="size-5 text-primary" />
          <h2 className="mt-3 font-medium">Weekly SLT meeting</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Run the weekly leadership review across pillars, KPIs and actions —
            including the Company Map tab.
          </p>
        </Link>


        {(isActive || isExpired) && (
          <AddonCard
            to="/report/team-room"
            icon={Users}
            title="AI Exec Team Room"
            body="Convene your AI senior leadership team on live company data."
            expired={isExpired}
          />
        )}

        {(isActive || isExpired) && (
          <AddonCard
            to="/report/enterprise-network"
            icon={Network}
            title="Enterprise Network"
            body="Model the business as one connected system and simulate how a change ripples through it."
            expired={isExpired}
          />
        )}
      </div>
    </div>
  );
}
