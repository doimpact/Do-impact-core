// Exports the board report preview (Page[]) as an editable PowerPoint.
// Consumes the same Block/Page shape used by the PDF renderer so both stay in sync.
import PptxGenJS from "pptxgenjs";
import type { Block, Page } from "@/lib/board-report-blocks";

export type { Block, Page };


const BRAND = "E85D3A";
const INK = "171B21";
const SUB = "6E7681";
const SOFT = "F4F6F9";
const GREEN = "22C55E";
const YELLOW = "EAB308";
const RED = "EF4444";

// Slide layout: 13.333 x 7.5 (LAYOUT_WIDE)
const W = 13.333;
const H = 7.5;
const M = 0.5;

function rygColor(v: string): string | undefined {
  const s = (v || "").trim().toLowerCase();
  if (["green", "on", "on track", "ok", "healthy", "complete", "closed", "done"].includes(s)) return GREEN;
  if (["yellow", "amber", "at risk", "warning", "in progress"].includes(s)) return YELLOW;
  if (["red", "off", "off track", "blocked", "open", "critical"].includes(s)) return RED;
  return undefined;
}

export async function generateBoardPptx(opts: {
  companyName: string;
  periodLabel: string;
  pages: Page[];
  fileName?: string;
}): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `${opts.companyName} — ${opts.periodLabel}`;
  pptx.company = opts.companyName;

  for (const page of opts.pages) {
    if (page.dark) {
      renderCover(pptx, opts.companyName, opts.periodLabel);
      continue;
    }
    renderContentPage(pptx, page);
  }

  const fileName = opts.fileName ?? `${opts.companyName.replace(/\s+/g, "_")}_Board_Report.pptx`;
  const { saveBlob } = await import("@/lib/save-blob");
  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  await saveBlob(blob, fileName, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
}

function renderCover(pptx: PptxGenJS, company: string, period: string) {
  const s = pptx.addSlide();
  s.background = { color: INK };
  s.addShape("rect", { x: 0, y: 3.1, w: 1.6, h: 0.12, fill: { color: BRAND }, line: { color: BRAND } });
  s.addText("BOARD REPORT", {
    x: M, y: 2.5, w: W - M * 2, h: 0.4,
    fontSize: 12, bold: true, color: "9CA3AF", charSpacing: 6,
  });
  s.addText(company, {
    x: M, y: 3.3, w: W - M * 2, h: 1.2,
    fontSize: 54, bold: true, color: "FFFFFF",
  });
  s.addText(period, {
    x: M, y: 4.5, w: W - M * 2, h: 0.6,
    fontSize: 24, bold: true, color: BRAND,
  });
  s.addText("Prepared for the Board of Directors", {
    x: M, y: 5.2, w: W - M * 2, h: 0.3,
    fontSize: 12, color: "D1D5DB",
  });
  s.addShape("rect", { x: W - 2.5, y: 6.9, w: 2.0, h: 0.06, fill: { color: BRAND }, line: { color: BRAND } });
}

function renderContentPage(pptx: PptxGenJS, page: Page) {
  // A single "page" from the PDF preview may contain many blocks; render on a slide
  // and spill to a new slide if we run out of vertical space.
  let slide = newContentSlide(pptx);
  let y = M + 0.1;

  const ensure = (needed: number) => {
    if (y + needed > H - M) {
      slide = newContentSlide(pptx);
      y = M + 0.1;
    }
  };

  for (const b of page.blocks) {
    if (b.type === "h1") {
      ensure(1.1);
      slide.addShape("rect", { x: M, y, w: 0.12, h: 0.6, fill: { color: BRAND }, line: { color: BRAND } });
      slide.addText(b.text, {
        x: M + 0.25, y, w: W - M * 2 - 0.25, h: 0.55,
        fontSize: 28, bold: true, color: INK,
      });
      if (b.sub) {
        slide.addText(b.sub, {
          x: M + 0.25, y: y + 0.55, w: W - M * 2 - 0.25, h: 0.35,
          fontSize: 13, color: SUB,
        });
        y += 1.05;
      } else {
        y += 0.75;
      }
    } else if (b.type === "h2") {
      ensure(0.55);
      slide.addText(b.text, {
        x: M, y, w: W - M * 2, h: 0.4,
        fontSize: 16, bold: true, color: INK,
      });
      y += 0.5;
    } else if (b.type === "p") {
      const h = Math.max(0.35, Math.ceil(b.text.length / 110) * 0.25);
      ensure(h + 0.1);
      slide.addText(b.text, {
        x: M, y, w: W - M * 2, h,
        fontSize: 12, color: INK, valign: "top",
      });
      y += h + 0.1;
    } else if (b.type === "note") {
      const inner = Math.max(0.35, Math.ceil(b.text.length / 100) * 0.26);
      const h = inner + (b.title ? 0.34 : 0) + 0.24;
      ensure(h + 0.15);
      slide.addShape("rect", { x: M, y, w: W - M * 2, h, fill: { color: SOFT }, line: { color: "E1E4E8" } });
      slide.addShape("rect", { x: M, y, w: 0.07, h, fill: { color: BRAND }, line: { color: BRAND } });
      if (b.title) {
        slide.addText(b.title, { x: M + 0.2, y: y + 0.08, w: W - M * 2 - 0.4, h: 0.3, fontSize: 13, bold: true, color: INK });
      }
      slide.addText(b.text, {
        x: M + 0.2, y: y + (b.title ? 0.42 : 0.12), w: W - M * 2 - 0.4, h: inner,
        fontSize: 12, color: INK, valign: "top",
      });
      y += h + 0.15;
    } else if (b.type === "stats") {

      ensure(1.1);
      const n = b.items.length || 1;
      const gap = 0.2;
      const cw = (W - M * 2 - gap * (n - 1)) / n;
      b.items.forEach((it, i) => {
        const x = M + i * (cw + gap);
        slide.addShape("roundRect", {
          x, y, w: cw, h: 1.0,
          fill: { color: SOFT }, line: { color: "E5E7EB" }, rectRadius: 0.08,
        });
        slide.addText(it.label.toUpperCase(), {
          x: x + 0.15, y: y + 0.1, w: cw - 0.3, h: 0.3,
          fontSize: 9, bold: true, color: SUB, charSpacing: 2,
        });
        slide.addText(it.value, {
          x: x + 0.15, y: y + 0.35, w: cw - 0.3, h: 0.6,
          fontSize: 22, bold: true, color: (it.color ?? INK).replace("#", ""),
        });
      });
      y += 1.15;
    } else if (b.type === "table") {
      const rowH = 0.28;
      const headerH = 0.32;
      const maxRows = Math.max(2, Math.floor((H - M - y - 0.1 - headerH) / rowH));
      let remaining = b.rows;
      while (remaining.length) {
        ensure(headerH + rowH * 2);
        const capacity = Math.max(2, Math.floor((H - M - y - 0.1 - headerH) / rowH));
        const chunk = remaining.slice(0, capacity);
        remaining = remaining.slice(capacity);
        const tableRows: PptxGenJS.TableRow[] = [];
        tableRows.push(b.head.map((h) => ({
          text: h,
          options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 10, valign: "middle", align: "left" },
        })) as unknown as PptxGenJS.TableRow);
        chunk.forEach((row, ri) => {
          tableRows.push(row.map((cell, ci) => {
            const c = String(cell ?? "");
            let color: string | undefined;
            if (b.rygColumns?.includes(ci)) color = rygColor(c);
            return {
              text: c,
              options: {
                fontSize: 9, color: color ?? INK,
                bold: !!color,
                fill: { color: ri % 2 === 0 ? "FFFFFF" : SOFT },
                valign: "middle", align: "left",
              },
            };
          }) as unknown as PptxGenJS.TableRow);
        });
        slide.addTable(tableRows, {
          x: M, y, w: W - M * 2,
          colW: b.head.map(() => (W - M * 2) / b.head.length),
          border: { type: "solid", color: "E5E7EB", pt: 0.5 },
        });
        y += headerH + rowH * chunk.length + 0.2;
        if (remaining.length) {
          slide = newContentSlide(pptx);
          y = M + 0.1;
        }
        void maxRows;
      }
    } else if (b.type === "retro") {
      ensure(2.5);
      const colW = (W - M * 2 - 0.3) / 2;
      const boxes: [string, string[], string][] = [
        ["Working well", b.working, GREEN],
        ["Can improve", b.improve, YELLOW],
      ];
      boxes.forEach(([title, items, color], i) => {
        const x = M + i * (colW + 0.3);
        slide.addShape("roundRect", {
          x, y, w: colW, h: 2.3,
          fill: { color: SOFT }, line: { color: "E5E7EB" }, rectRadius: 0.08,
        });
        slide.addText(title, {
          x: x + 0.15, y: y + 0.1, w: colW - 0.3, h: 0.3,
          fontSize: 12, bold: true, color,
        });
        const body = items.length ? items.map((t) => `• ${t}`).join("\n") : "—";
        slide.addText(body, {
          x: x + 0.15, y: y + 0.45, w: colW - 0.3, h: 1.75,
          fontSize: 10, color: INK, valign: "top",
        });
      });
      y += 2.5;
    } else if (b.type === "plan_chart") {
      ensure(3.2);
      const chartData = [
        { name: "Target",   labels: b.rows.map((r) => r.label), values: b.rows.map((r) => r.target) },
        { name: "Booked",   labels: b.rows.map((r) => r.label), values: b.rows.map((r) => r.booked) },
        { name: "Weighted", labels: b.rows.map((r) => r.label), values: b.rows.map((r) => r.weighted) },
      ];
      slide.addChart(pptx.ChartType.bar, chartData, {
        x: M, y, w: W - M * 2, h: 3.0,
        barDir: "col", barGrouping: "clustered",
        showLegend: true, legendPos: "b",
        chartColors: [SUB, BRAND, "60A5FA"],
        showValue: false,
        catAxisLabelFontSize: 9,
        valAxisLabelFontSize: 9,
      });
      y += 3.1;
    } else if (b.type === "kpi_charts") {
      ensure(0.5);
      slide.addText(b.pillar, {
        x: M, y, w: W - M * 2, h: 0.35,
        fontSize: 14, bold: true, color: INK,
      });
      y += 0.4;
      const perRow = 2;
      const gap = 0.25;
      const cw = (W - M * 2 - gap * (perRow - 1)) / perRow;
      const ch = 2.2;
      b.kpis.forEach((k, i) => {
        const col = i % perRow;
        const row = Math.floor(i / perRow);
        if (col === 0 && row > 0) {
          ensure(ch + 0.2);
        }
        const x = M + col * (cw + gap);
        const yy = y + row * (ch + 0.2);
        const color = k.status === "on" ? GREEN : k.status === "off" ? RED : SUB;
        slide.addShape("roundRect", {
          x, y: yy, w: cw, h: ch,
          fill: { color: "FFFFFF" }, line: { color: "E5E7EB" }, rectRadius: 0.06,
        });
        slide.addText(k.name, {
          x: x + 0.15, y: yy + 0.1, w: cw - 1.5, h: 0.3,
          fontSize: 11, bold: true, color: INK,
        });
        slide.addText(
          k.latest != null ? `${k.latest.toLocaleString()} ${k.unit ?? ""}`.trim() : "—",
          { x: x + cw - 1.6, y: yy + 0.1, w: 1.45, h: 0.3, fontSize: 10, bold: true, color, align: "right" },
        );
        slide.addChart(pptx.ChartType.line, [
          { name: "Actual", labels: k.points.map((p) => p.month), values: k.points.map((p) => p.actual ?? 0) },
          { name: "Target", labels: k.points.map((p) => p.month), values: k.points.map((p) => p.target ?? 0) },
        ], {
          x: x + 0.1, y: yy + 0.45, w: cw - 0.2, h: ch - 0.55,
          showLegend: false,
          chartColors: [BRAND, SUB],
          catAxisLabelFontSize: 7,
          valAxisLabelFontSize: 7,
          lineDataSymbol: "none",
        });
      });
      const rows = Math.ceil(b.kpis.length / perRow);
      y += rows * (ch + 0.2);
    } else if (b.type === "driver_tree") {
      ensure(1.0);
      slide.addText(`Vision: ${b.vision || "—"}`, {
        x: M, y, w: W - M * 2, h: 0.4, fontSize: 12, italic: true, color: SUB,
      });
      y += 0.45;
      slide.addText(
        `Total value: ${b.totals.total.toLocaleString()}   •   On track: ${b.totals.onTrack.toLocaleString()}   •   At risk: ${b.totals.atRisk.toLocaleString()}`,
        { x: M, y, w: W - M * 2, h: 0.35, fontSize: 11, bold: true, color: INK },
      );
      y += 0.5;
      if (b.levers.length) {
        const tableRows: PptxGenJS.TableRow[] = [];
        tableRows.push(
          ["Lever", "Objective", "Year", "Target", "Status"].map((h) => ({
            text: h,
            options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 10 },
          })) as unknown as PptxGenJS.TableRow,
        );
        for (const lever of b.levers) {
          if (!lever.items.length) {
            tableRows.push([
              { text: lever.title, options: { bold: true, color: lever.color.replace("#", ""), fontSize: 10 } },
              { text: lever.description ?? "—", options: { fontSize: 9, color: SUB } },
              { text: "" }, { text: "" }, { text: "" },
            ] as unknown as PptxGenJS.TableRow);
          } else {
            lever.items.forEach((it, idx) => {
              tableRows.push([
                { text: idx === 0 ? lever.title : "", options: { bold: true, color: lever.color.replace("#", ""), fontSize: 10 } },
                { text: it.title, options: { fontSize: 9, color: INK } },
                { text: it.horizon_year ? String(it.horizon_year) : "", options: { fontSize: 9 } },
                { text: it.target_metric ?? "", options: { fontSize: 9 } },
                {
                  text: it.status ?? "",
                  options: { fontSize: 9, bold: !!rygColor(it.status ?? ""), color: rygColor(it.status ?? "") ?? INK },
                },
              ] as unknown as PptxGenJS.TableRow);
            });
          }
        }
        ensure(0.5);
        slide.addTable(tableRows, {
          x: M, y, w: W - M * 2,
          colW: [2.2, 4.5, 0.8, 3.0, 1.83].map((v) => v * (W - M * 2) / 12.33),
          border: { type: "solid", color: "E5E7EB", pt: 0.5 },
        });
        y += 0.4 + tableRows.length * 0.28;
      }
    } else if (b.type === "custom_waterfall") {
      ensure(3.6);
      slide.addText(b.title, { x: M, y, w: W - M * 2, h: 0.35, fontSize: 14, bold: true, color: INK });
      y += 0.4;
      const chartW = (W - M * 2) * 0.6;
      const chartH = 3.0;
      const textX = M + chartW + 0.2;
      const textW = W - M - textX;
      // Build stacked-bar data (base invisible + delta visible) using range
      let mn = 0, mx = 0;
      for (const r of b.rows) { mn = Math.min(mn, r.range[0], r.range[1]); mx = Math.max(mx, r.range[0], r.range[1]); }
      const labels = b.rows.map((r) => r.name);
      const baseVals = b.rows.map((r) => Math.min(r.range[0], r.range[1]) - mn);
      const deltaVals = b.rows.map((r) => Math.abs(r.range[1] - r.range[0]));
      slide.addChart(pptx.ChartType.bar, [
        { name: "_base", labels, values: baseVals },
        { name: "Value", labels, values: deltaVals },
      ], {
        x: M, y, w: chartW, h: chartH,
        barDir: "col", barGrouping: "stacked",
        showLegend: false,
        chartColors: ["FFFFFF", BRAND],
        chartColorsOpacity: 100,
        catAxisLabelFontSize: 8,
        valAxisLabelFontSize: 8,
        valAxisMinVal: 0,
        valAxisMaxVal: mx - mn,
      });
      // right text box
      slide.addShape("roundRect", { x: textX, y, w: textW, h: chartH, fill: { color: SOFT }, line: { color: "E5E7EB" }, rectRadius: 0.06 });
      let ty = y + 0.1;
      if (b.comment) {
        slide.addText(b.comment, { x: textX + 0.1, y: ty, w: textW - 0.2, h: 0.6, fontSize: 10, italic: true, color: INK, valign: "top" });
        ty += 0.65;
      }
      slide.addText("LEVERS", { x: textX + 0.1, y: ty, w: textW - 0.2, h: 0.25, fontSize: 9, bold: true, color: SUB, charSpacing: 2 });
      ty += 0.28;
      const bodyLines = b.levers.map((l) => {
        const sign = (l.delta >= 0 ? "+" : "−") + Math.abs(l.delta).toLocaleString();
        return `• ${l.label}  (${sign})${l.comment ? `\n    ${l.comment}` : ""}`;
      }).join("\n");
      slide.addText(bodyLines || "—", {
        x: textX + 0.1, y: ty, w: textW - 0.2, h: y + chartH - ty - 0.1,
        fontSize: 9, color: INK, valign: "top",
      });
      y += chartH + 0.2;
    }
  }
}


function newContentSlide(pptx: PptxGenJS): PptxGenJS.Slide {
  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };
  // Header accent
  s.addShape("rect", { x: 0, y: 0, w: W, h: 0.12, fill: { color: BRAND }, line: { color: BRAND } });
  return s;
}
