import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AM_CHECK_ITEMS, AM_LEVELS, EQUIP_CRITICALITY, PM_FREQUENCIES, TAG_COLOURS } from "@/lib/ampm";
import { Badge } from "@/components/ui/badge";

export function AmpmFrameworkNotes() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Who owns what</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">AM — operators.</strong> Basic equipment care and early detection.</p>
          <p><strong className="text-foreground">PM — maintenance.</strong> Planned technical maintenance and reliability.</p>
          <p><strong className="text-foreground">Engineering.</strong> Eliminates chronic problems and improves equipment.</p>
          <p className="pt-1">
            Operators do NOT perform electrical work, major mechanical repair, hydraulic or pneumatic repair,
            safety-system work, calibration or programme changes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">AM levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {AM_LEVELS.map((l) => (
            <div key={l.n}>
              <span className="font-medium">{l.label}</span>
              <p className="text-xs text-muted-foreground">{l.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Criticality drives everything downstream</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {EQUIP_CRITICALITY.map((c) => (
            <div key={c.key} className="flex gap-2">
              <Badge className={c.className}>{c.key}</Badge>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
            Criticality sets PM frequency, spare holding, condition monitoring and response priority.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">PM frequency framework</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {PM_FREQUENCIES.map((f) => (
            <div key={f.key}>
              <span className="font-medium">{f.label}</span>
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Operator daily check (15 points)</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid list-decimal gap-1 pl-5 text-sm text-muted-foreground sm:grid-cols-2">
            {AM_CHECK_ITEMS.map((i) => (
              <li key={i.key}>{i.label}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tagging & abnormality flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {TAG_COLOURS.map((t) => (
            <div key={t.key} className="flex gap-2">
              <Badge className={t.className}>{t.label}</Badge>
              <p className="text-xs text-muted-foreground">{t.hint}</p>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
            Detect → tag → report → maintenance assess → run / plan / stop → corrective action → verify → remove tag.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">90-day implementation plan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="font-medium">Days 1–30 — see the equipment</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              <li>Build the equipment register and classify criticality A–D</li>
              <li>Assign operator and maintenance owner per asset</li>
              <li>Launch the 15-point daily check on A assets</li>
              <li>Start red/yellow/green tagging and clear the first backlog</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Days 31–60 — plan the work</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              <li>Write PM tasks and frequencies for every A and B asset</li>
              <li>Document lubrication points and critical spares with min/max</li>
              <li>Start work orders with findings, hours and verification</li>
              <li>Begin logging every breakdown with downtime and repair time</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Days 61–90 — improve reliability</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              <li>Review PM compliance and planned vs emergency hours monthly</li>
              <li>Root-cause every repeat, chronic and safety failure</li>
              <li>Convert temporary fixes to permanent with due dates</li>
              <li>Feed findings back into AM checks and PM content</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
