import { Link } from "@tanstack/react-router";

export type SectionTab = { label: string; to: string };

export const SKILLS_TABS: SectionTab[] = [
  { label: "Catalog", to: "/people/skills" },
  { label: "Skill matrix", to: "/people/matrix" },
  { label: "Gaps", to: "/people/gaps" },
];

export const DEVELOPMENT_TABS: SectionTab[] = [
  { label: "Development plans", to: "/people/development" },
  { label: "Certifications", to: "/people/certifications" },
];

export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  return (
    <nav className="mb-5 flex flex-wrap gap-1 border-b" aria-label="Section">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          activeOptions={{ exact: true }}
          className="-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "-mb-px border-b-2 border-primary px-3 py-2 text-sm font-medium text-foreground" }}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
