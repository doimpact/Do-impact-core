// Block-based PDF renderer for the Board Report. Consumes exactly the same
// Page[]/Block[] contract as the on-page preview and the PowerPoint export, so
// every edit made in the preview shows up here too.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Block, DriverLever, KpiChart, Page, PlanRow } from "@/lib/board-report-blocks";
import { KPI_MONTHS } from "@/lib/board-report-blocks";
import { saveBlob } from "@/lib/save-blob";

type RGB = [number, number, number];

const BRAND: RGB = [232, 93, 58];
const INK: RGB = [23, 27, 33];
const SUB: RGB = [110, 118, 129];
const SOFT: RGB = [244, 246, 249];
const LINE: RGB = [225, 228, 232];
const GREEN: RGB = [34, 197, 94];
const YELLOW: RGB = [234, 179, 8];
const RED: RGB = [239, 68, 68];

function hexToRgb(hex?: string, fallback: RGB = BRAND): RGB {
  if (!hex) return fallback;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function generateBoardPdf(opts: {
  companyName: string;
  periodLabel: string;
  pages: Page[];
  fileName?: string;
  generatedOn?: Date;
}): Promise<void> {
  const { companyName, periodLabel, pages } = opts;
  const generatedOn = opts.generatedOn ?? new Date();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;
  let started = false;

  // jsPDF's built-in fonts are WinAnsi-only: characters like Δ, −, ’ or …
  // render as mojibake. Normalise every string that reaches the page.
  const ASCII_MAP: Record<string, string> = {
    "Δ": "Delta", "δ": "delta", "−": "-", "–": "-", "—": "-",
    "’": "'", "‘": "'", "“": '"', "”": '"', "…": "...", "·": "-",
    "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "×": "x", "±": "+/-", "°": "deg",
  };
  const toWinAnsi = (s: string) =>
    s
      .replace(/[ΔδΔ−–—’‘“”…·→←≥≤×±°]/g, (c) => ASCII_MAP[c] ?? c)
      .replace(/[^\x00-\xFF]/g, "");
  const rawText = doc.text.bind(doc);
  (doc as unknown as { text: typeof doc.text }).text = ((
    text: string | string[],
    ...rest: unknown[]
  ) =>
    rawText(
      Array.isArray(text) ? text.map((t) => toWinAnsi(String(t))) : toWinAnsi(String(text)),
      ...(rest as [number, number]),
    )) as typeof doc.text;


  const newPage = () => {
    doc.addPage();
    y = margin + 18;
  };
  const ensure = (h: number) => {
    if (y + h > pageH - 46) newPage();
  };
  const startSheet = () => {
    if (started) newPage();
    else y = margin + 18;
    started = true;
  };

  /* ---------- cover ---------- */
  const renderCover = () => {
    if (started) doc.addPage();
    started = true;
    doc.setFillColor(...INK);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setFillColor(...BRAND);
    doc.rect(0, pageH / 2 - 120, 80, 6, "F");
    doc.rect(pageW - 140, pageH - 190, 100, 4, "F");
    doc.setFillColor(0, 0, 0);
    doc.rect(0, pageH - 90, pageW, 90, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(170);
    doc.text("BOARD REPORT", margin, pageH / 2 - 80, { charSpace: 3 });

    doc.setFontSize(30);
    doc.setTextColor(255);
    const nameLines = doc.splitTextToSize(companyName, contentW);
    doc.text(nameLines, margin, pageH / 2 - 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(...BRAND);
    doc.text(periodLabel, margin, pageH / 2 - 40 + nameLines.length * 32);

    doc.setFontSize(10);
    doc.setTextColor(200);
    doc.text("Prepared for the Board of Directors", margin, pageH / 2 - 16 + nameLines.length * 32);

    doc.setFontSize(8);
    doc.setTextColor(170);
    doc.text(`Generated ${generatedOn.toLocaleDateString()}`, margin, pageH - 40);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255);
    doc.text("DO.Impact Operating System", pageW - margin, pageH - 40, { align: "right" });
    doc.setTextColor(0);
    y = margin;
  };

  /* ---------- primitives ---------- */
  const h1 = (t: string, subtitle?: string) => {
    const h = subtitle ? 54 : 40;
    ensure(h + 18);
    doc.setFillColor(...INK);
    doc.roundedRect(margin, y, contentW, h, 4, 4, "F");
    doc.setFillColor(...BRAND);
    doc.rect(margin, y, 4, h, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255);
    doc.text(doc.splitTextToSize(t, contentW - 30)[0] ?? t, margin + 16, y + (subtitle ? 22 : 26));
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(210);
      doc.text(doc.splitTextToSize(subtitle, contentW - 30)[0] ?? subtitle, margin + 16, y + 40);
    }
    y += h + 14;
    doc.setTextColor(0);
  };

  const h2 = (t: string) => {
    ensure(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(t, margin, y);
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(1.2);
    doc.line(margin, y + 4, margin + 24, y + 4);
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    y += 18;
  };

  const body = (t: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(t, contentW);
    ensure(lines.length * 13 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 6;
  };

  const note = (title: string | undefined, text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text || " ", contentW - 24);
    const h = lines.length * 13 + (title ? 20 : 0) + 18;
    ensure(h + 8);
    doc.setFillColor(...SOFT);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentW, h, 4, 4, "FD");
    doc.setFillColor(...BRAND);
    doc.rect(margin, y, 3, h, "F");
    let ty = y + 16;
    if (title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      doc.text(title, margin + 14, ty);
      ty += 16;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(lines, margin + 14, ty);
    y += h + 12;
  };

  const statBoxes = (items: { label: string; value: string; color?: string }[]) => {
    if (!items.length) return;
    const gap = 10;
    const w = (contentW - gap * (items.length - 1)) / items.length;
    const h = 52;
    ensure(h + 10);
    items.forEach((it, i) => {
      const x = margin + i * (w + gap);
      doc.setFillColor(...SOFT);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, w, h, 4, 4, "FD");
      doc.setFillColor(...hexToRgb(it.color));
      doc.rect(x, y, 3, h, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...SUB);
      doc.text(doc.splitTextToSize(it.label.toUpperCase(), w - 16)[0] ?? "", x + 10, y + 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(it.value, w - 16)[0] ?? "", x + 10, y + 36);
    });
    y += h + 12;
    doc.setTextColor(0);
  };

  const rygFor = (v: string): RGB | null => {
    const s = (v || "").trim().toLowerCase();
    if (s.startsWith("gre") || s === "on" || s === "on track") return GREEN;
    if (s.startsWith("yel") || s.startsWith("amb") || s === "at risk") return YELLOW;
    if (s.startsWith("red") || s === "off" || s === "off track") return RED;
    return null;
  };

  const table = (b: Extract<Block, { type: "table" }>) => {
    const ryg = b.rygColumns ?? [];
    const pct = b.pctColumns ?? [];
    ensure(60);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentW,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 5, overflow: "linebreak", valign: "top", lineColor: LINE, textColor: INK },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: "bold", fontSize: 8.5 },
      alternateRowStyles: { fillColor: SOFT },
      head: [b.head],
      body: b.rows.map((r) => r.map((c) => (c == null ? "" : String(c)))),
      didParseCell: (data) => {
        if (data.section !== "body") return;
        const ci = data.column.index;
        const raw = String(data.cell.raw ?? "");
        if (ryg.includes(ci)) {
          const fill = rygFor(raw);
          if (fill) {
            data.cell.styles.fillColor = fill;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.halign = "center";
          }
        }
        if (pct.includes(ci)) {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) {
            data.cell.styles.fillColor = n >= 85 ? GREEN : n >= 60 ? YELLOW : RED;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.halign = "center";
          }
        }
      },
    });
    // @ts-expect-error autoTable attaches lastAutoTable
    y = doc.lastAutoTable.finalY + 14;
  };

  const retro = (working: string[], improve: string[]) => {
    const colW = (contentW - 12) / 2;
    doc.setFontSize(9);
    const wLines = (working.length ? working : ["—"]).flatMap((t) => doc.splitTextToSize(`• ${t}`, colW - 16));
    const iLines = (improve.length ? improve : ["—"]).flatMap((t) => doc.splitTextToSize(`• ${t}`, colW - 16));
    const h = Math.max(wLines.length, iLines.length) * 12 + 34;
    ensure(h + 10);
    const draw = (x: number, title: string, lines: string[], border: RGB, fill: RGB, titleColor: RGB) => {
      doc.setFillColor(...fill);
      doc.setDrawColor(...border);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, colW, h, 4, 4, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...titleColor);
      doc.text(title, x + 10, y + 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(lines, x + 10, y + 30);
    };
    draw(margin, "Working well", wLines, [167, 243, 208], [236, 253, 245], [6, 95, 70]);
    draw(margin + colW + 12, "Can be improved", iLines, [253, 230, 138], [255, 251, 235], [146, 64, 14]);
    y += h + 12;
  };

  const planChart = (rows: PlanRow[]) => {
    if (!rows.length) return;
    const chartH = 200;
    ensure(chartH + 30);
    const padL = 40, padR = 8, padT = 10, padB = 26;
    const cx0 = margin, cy0 = y;
    const plotW = contentW - padL - padR, plotH = chartH - padT - padB;
    const maxV = Math.max(1, ...rows.map((r) => Math.max(r.target, r.booked + r.weighted)));
    const barW = plotW / rows.length;
    const bw = Math.max(1.5, barW * 0.6);
    const step = Math.max(1, Math.ceil(rows.length / 14));
    for (let gi = 0; gi <= 4; gi++) {
      const gy = cy0 + padT + (plotH * gi) / 4;
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.4);
      doc.line(cx0 + padL, gy, cx0 + padL + plotW, gy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...SUB);
      doc.text(`${Math.round((maxV * (1 - gi / 4)) / 1000)}k`, cx0 + padL - 4, gy + 3, { align: "right" });
    }
    rows.forEach((r, ri) => {
      const x = cx0 + padL + ri * barW + (barW - bw) / 2;
      const bookedH = (r.booked / maxV) * plotH;
      const weightedH = (r.weighted / maxV) * plotH;
      const baseY = cy0 + padT + plotH;
      doc.setFillColor(...GREEN);
      doc.rect(x, baseY - bookedH, bw, Math.max(0.5, bookedH), "F");
      doc.setFillColor(...YELLOW);
      doc.rect(x, baseY - bookedH - weightedH, bw, Math.max(0.5, weightedH), "F");
      if (ri % step === 0) {
        doc.setFontSize(6.5);
        doc.setTextColor(...SUB);
        doc.text(r.label, x + bw / 2, baseY + 10, { align: "center" });
      }
    });
    doc.setDrawColor(...RED);
    doc.setLineWidth(1.2);
    let prev: [number, number] | null = null;
    rows.forEach((r, ri) => {
      const px = cx0 + padL + ri * barW + barW / 2;
      const py = cy0 + padT + plotH - (r.target / maxV) * plotH;
      if (prev) doc.line(prev[0], prev[1], px, py);
      prev = [px, py];
    });
    doc.setLineWidth(0.5);
    y = cy0 + chartH + 6;
    // legend
    const legend: [string, RGB][] = [["Booked backlog", GREEN], ["Weighted pipeline", YELLOW], ["Target", RED]];
    let lx = margin;
    doc.setFontSize(7.5);
    legend.forEach(([label, color]) => {
      doc.setFillColor(...color);
      doc.rect(lx, y - 6, 7, 7, "F");
      doc.setTextColor(...INK);
      doc.text(label, lx + 10, y);
      lx += doc.getTextWidth(label) + 26;
    });
    y += 16;
    doc.setTextColor(0);
  };

  const kpiCharts = (pillar: string, kpis: KpiChart[]) => {
    if (!kpis.length) return;
    h2(pillar);
    const gap = 10;
    const cardW = (contentW - gap) / 2;
    const cardH = 108;
    for (let i = 0; i < kpis.length; i += 2) {
      ensure(cardH + 12);
      const rowKpis = kpis.slice(i, i + 2);
      rowKpis.forEach((kp, ci) => {
        const x = margin + ci * (cardW + gap);
        const cy = y;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, cy, cardW, cardH, 3, 3, "FD");
        const dot: RGB = kp.status === "on" ? GREEN : kp.status === "off" ? RED : [200, 205, 210];
        doc.setFillColor(...dot);
        doc.circle(x + 9, cy + 12, 2.4, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...INK);
        doc.text(doc.splitTextToSize(kp.name, cardW - 90)[0] ?? kp.name, x + 15, cy + 14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...SUB);
        doc.text(`Target ${kp.target ?? "—"} ${kp.unit}`.trim(), x + 15, cy + 24);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...INK);
        doc.text(`${kp.latest ?? "—"}`, x + cardW - 8, cy + 16, { align: "right" });

        const padL = 26, padR = 8, padT = 32, padB = 16;
        const plotW = cardW - padL - padR, plotH = cardH - padT - padB;
        const nums = kp.points.flatMap((p) => [p.actual, p.target]).filter((v): v is number => v != null);
        const maxV = nums.length ? Math.max(...nums) * 1.1 : 1;
        const minV = nums.length ? Math.min(0, Math.min(...nums)) : 0;
        const xAt = (idx: number) => x + padL + (idx / 11) * plotW;
        const yAt = (v: number) => cy + padT + plotH - ((v - minV) / (maxV - minV || 1)) * plotH;
        for (let gi = 0; gi <= 2; gi++) {
          const gy = cy + padT + (plotH * gi) / 2;
          doc.setDrawColor(...LINE);
          doc.setLineWidth(0.3);
          doc.line(x + padL, gy, x + padL + plotW, gy);
          doc.setFontSize(6);
          doc.setTextColor(...SUB);
          doc.text(String(Math.round(maxV - ((maxV - minV) * gi) / 2)), x + padL - 3, gy + 2, { align: "right" });
        }
        const drawSeries = (key: "actual" | "target", color: RGB, width: number, dash: boolean) => {
          doc.setDrawColor(...color);
          doc.setLineWidth(width);
          if (dash) doc.setLineDashPattern([2, 2], 0);
          let prev: [number, number] | null = null;
          kp.points.forEach((p, pi) => {
            const v = p[key];
            if (v == null) { prev = null; return; }
            const pt: [number, number] = [xAt(pi), yAt(v)];
            if (prev) doc.line(prev[0], prev[1], pt[0], pt[1]);
            prev = pt;
          });
          if (dash) doc.setLineDashPattern([], 0);
        };
        drawSeries("target", BRAND, 0.8, true);
        drawSeries("actual", INK, 1.2, false);
        doc.setFontSize(5.5);
        doc.setTextColor(...SUB);
        KPI_MONTHS.forEach((m, mi) => {
          if (mi % 2 === 0) doc.text(m, xAt(mi), cy + cardH - 5, { align: "center" });
        });
        doc.setLineWidth(0.5);
      });
      y += cardH + 10;
    }
    doc.setTextColor(0);
  };

  const driverTree = (vision: string, totals: { total: number; onTrack: number; atRisk: number }, levers: DriverLever[]) => {
    note("Vision", vision);
    statBoxes([
      { label: "Objectives", value: String(totals.total) },
      { label: "On track", value: String(totals.onTrack), color: "#22c55e" },
      { label: "At risk", value: String(totals.atRisk), color: "#ef4444" },
    ]);
    for (const lever of levers) {
      ensure(46);
      doc.setFillColor(...hexToRgb(lever.color, [156, 163, 175]));
      doc.roundedRect(margin, y, contentW, 24, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255);
      doc.text(doc.splitTextToSize(lever.title, contentW - 20)[0] ?? lever.title, margin + 10, y + 16);
      y += 30;
      doc.setTextColor(0);
      if (lever.description) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...SUB);
        const lines = doc.splitTextToSize(lever.description, contentW);
        ensure(lines.length * 11 + 4);
        doc.text(lines, margin, y);
        y += lines.length * 11 + 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
      }
      if (lever.items.length) {
        table({
          type: "table",
          head: ["Objective", "Year", "Target", "Status"],
          rows: lever.items.map((it) => [it.title, String(it.horizon_year ?? ""), it.target_metric ?? "", it.status ?? ""]),
          rygColumns: [],
        });
      } else {
        body("No objectives linked to this lever.");
      }
    }
  };

  const customWaterfall = (b: Extract<Block, { type: "custom_waterfall" }>) => {
    const rows = b.rows;
    let mn = 0, mx = 0;
    for (const r of rows) {
      mn = Math.min(mn, r.range[0], r.range[1]);
      mx = Math.max(mx, r.range[0], r.range[1]);
    }
    if (mx === mn) mx = mn + 1;
    const chartH = 180;
    ensure(chartH + 40);
    h2(b.title || "Bridge");
    const chartW = contentW * 0.6 - 6;
    const textX = margin + chartW + 12;
    const textW = contentW - chartW - 12;
    const chartX = margin, chartY = y;
    const padL = 6, padR = 6, padT = 16, padB = 22;
    const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
    const barW = plotW / Math.max(1, rows.length);
    const bw = Math.max(3, barW * 0.7);
    const yAt = (v: number) => chartY + padT + plotH - ((v - mn) / (mx - mn || 1)) * plotH;
    doc.setDrawColor(210);
    doc.setLineWidth(0.4);
    doc.line(chartX + padL, chartY + padT + plotH, chartX + padL + plotW, chartY + padT + plotH);
    rows.forEach((r, ri) => {
      const x = chartX + padL + ri * barW + (barW - bw) / 2;
      const y1 = yAt(Math.max(r.range[0], r.range[1]));
      const y2 = yAt(Math.min(r.range[0], r.range[1]));
      doc.setFillColor(...hexToRgb(r.fill, r.isAnchor ? [45, 92, 72] : r.signed >= 0 ? [59, 130, 246] : [239, 68, 68]));
      doc.rect(x, y1, bw, Math.max(1, y2 - y1), "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...INK);
      doc.text(r.label, x + bw / 2, y1 - 2, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...SUB);
      doc.text(r.name.length > 12 ? `${r.name.slice(0, 11)}…` : r.name, x + bw / 2, chartY + chartH - 6, { align: "center" });
    });
    doc.setDrawColor(...LINE);
    doc.setFillColor(...SOFT);
    doc.roundedRect(textX, chartY, textW, chartH, 3, 3, "FD");
    let ty = chartY + 12;
    if (b.comment) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      const cLines = doc.splitTextToSize(b.comment, textW - 12).slice(0, 4);
      doc.text(cLines, textX + 6, ty);
      ty += cLines.length * 10 + 4;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...SUB);
    doc.text("LEVERS", textX + 6, ty);
    ty += 10;
    const maxLevers = Math.floor((chartY + chartH - ty) / 14);
    b.levers.slice(0, Math.max(0, maxLevers)).forEach((l) => {
      const pos = l.delta >= 0;
      doc.setFillColor(...(pos ? ([59, 130, 246] as RGB) : ([239, 68, 68] as RGB)));
      doc.circle(textX + 8, ty - 2, 1.6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(l.label, textW - 60)[0] ?? l.label, textX + 13, ty);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...(pos ? ([37, 99, 235] as RGB) : ([220, 38, 38] as RGB)));
      doc.text(`${pos ? "+" : "−"}${Math.abs(l.delta).toLocaleString()}`, textX + textW - 6, ty, { align: "right" });
      if (l.comment) {
        doc.setFontSize(7);
        doc.setTextColor(...SUB);
        doc.text(doc.splitTextToSize(l.comment, textW - 20)[0] ?? "", textX + 13, ty + 6);
      }
      ty += 14;
    });
    y = chartY + chartH + 12;
    doc.setTextColor(0);
  };

  /* ---------- walk pages ---------- */
  for (const page of pages) {
    if (page.dark) {
      renderCover();
      continue;
    }
    startSheet();
    for (const b of page.blocks) {
      switch (b.type) {
        case "h1": h1(b.text, b.sub); break;
        case "h2": h2(b.text); break;
        case "p": body(b.text); break;
        case "note": note(b.title, b.text); break;
        case "stats": statBoxes(b.items); break;
        case "table": table(b); break;
        case "retro": retro(b.working, b.improve); break;
        case "plan_chart": planChart(b.rows); break;
        case "kpi_charts": kpiCharts(b.pillar, b.kpis); break;
        case "driver_tree": driverTree(b.vision, b.totals, b.levers); break;
        case "custom_waterfall": customWaterfall(b); break;
        default: break;
      }
    }
  }

  /* ---------- header / footer ---------- */
  const total = doc.getNumberOfPages();
  const coverIndex = pages.findIndex((p) => p.dark) === 0 ? 1 : -1;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i !== coverIndex) {
      doc.setFillColor(...INK);
      doc.rect(0, 0, pageW, 18, "F");
      doc.setFillColor(...BRAND);
      doc.rect(0, 18, pageW, 2, "F");
      doc.setTextColor(255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(companyName.toUpperCase(), margin, 12);
      doc.setFont("helvetica", "normal");
      doc.text(periodLabel, pageW - margin, 12, { align: "right" });
      doc.setFontSize(8);
      doc.setTextColor(...SUB);
      doc.text(`${companyName} · ${periodLabel}`, margin, pageH - 20);
      doc.text(`Page ${i} / ${total}`, pageW - margin, pageH - 20, { align: "right" });
    }
  }
  doc.setTextColor(0);

  const fileName = opts.fileName ?? `${companyName.replace(/\s+/g, "_")}_Board_Report.pdf`;
  const blob = doc.output("blob") as Blob;
  await saveBlob(blob, fileName, "application/pdf");
}
