import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MapPin, LifeBuoy } from "lucide-react";
import CareerJourneyAnimation from "@/components/about/CareerJourneyAnimation";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({
    meta: [
      { title: "About Alex Miller — Creator of DO.Impact" },
      {
        name: "description",
        content:
          "Meet Alex Miller, creator of DO.Impact — a global aerospace executive with 20+ years leading complex manufacturing operations across Sweden, India and the United States.",
      },
      { property: "og:title", content: "About Alex Miller — Creator of DO.Impact" },
      {
        property: "og:description",
        content:
          "The story behind DO.Impact: 20+ years of aerospace and manufacturing leadership across Sweden, India and the United States.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <Link
          to="/overview"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          About DO.Impact
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          The person behind the system — and the operating experience it was built from.
        </p>
      </div>

      {/* Alex Miller bio */}
      <section className="rounded-xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Alex Miller
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground">
          <p>
            I founded DoImpact after a realization that stayed with me long after reading a report on the state of manufacturing. Small manufacturers — companies that make up more than 90% of the industry in both the U.S. and Europe — are under constant pressure from supply chain disruptions, labor shortages, rising costs, and the rapid emergence of AI. Yet I kept coming back to one thought: AI alone isn’t the answer. If the underlying operating model is fragmented, technology only helps organizations move faster in the wrong direction.
          </p>
          <p>
            Having spent more than two decades leading manufacturing and aerospace businesses across the U.S., Europe, and India, I knew these challenges firsthand. I began asking myself a simple question: What would the ideal operating management system look like for a small manufacturer? What started as an idea during my summer vacation quickly turned into a working prototype. That prototype became DoImpact — a platform built to help small manufacturers align strategy, improve execution, and build stronger, more resilient businesses. By establishing a connected operating model and a single source of truth, manufacturers are not only able to perform better today; they are also prepared to fully leverage AI, automation, and the growing ecosystem of digital tools and enterprise networks that will shape the future of manufacturing.
          </p>
          <p>
            Alex Miller is a global aerospace executive with over 20 years of experience leading complex aerospace and manufacturing operations across the U.S., Europe, and India. He is known for successfully driving complex site turnarounds, major capital investments, and building high-performing teams.
          </p>
          <p>
            David holds a Master of Science in Mechanical Engineering from Chalmers University of Technology, Sweden.
          </p>
        </div>
        <a
          href="https://www.linkedin.com/in/orthdavid"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Connect on LinkedIn
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-3.328-3.954-3.078-3.954 0v5.569H9.385V8.999h3.414v1.469c.825-1.603 5.78-1.85 5.78 3.218v6.766zM5.332 7.228a2.056 2.056 0 1 1 0-4.112 2.056 2.056 0 0 1 0 4.112zM7.11 20.452H3.555V8.999H7.11v11.453zM22.225 0H1.771C.791 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
      </section>

      {/* Career in Motion */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            A Career in Motion
          </h2>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            45-second journey · Sweden → India → US East → US West
          </span>
        </div>
        <CareerJourneyAnimation />
      </section>

      {/* Pointer to the product side */}
      <section className="border-t border-border pt-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Looking for the tool, not the person?
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            How DO.Impact works
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The framework guide, the problem-first module picker, the product tour and the getting
            started walkthrough all live under Support.
          </p>
          <Link
            to="/support"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <LifeBuoy className="h-4 w-4" />
            Open Support &amp; getting started
          </Link>
        </div>
      </section>

      {/* Back to overview */}
      <div className="pt-4">
        <Link
          to="/overview"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Back to Overview <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
