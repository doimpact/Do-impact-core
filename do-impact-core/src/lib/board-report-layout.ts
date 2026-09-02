// Editable-report overlay: a saved set of user edits (hidden blocks, deleted
// table rows/columns, block order, retitles, extra note blocks) applied to the
// generated Page[] before it reaches the preview, the PDF and the PowerPoint.
import type { Block, Page } from "@/lib/board-report-blocks";
import { tableRowKey } from "@/lib/board-report-blocks";

export type ReportLayout = {
  hiddenBlocks: string[];
  hiddenTableRows: Record<string, string[]>;
  hiddenTableCols: Record<string, number[]>;
  blockOrder: Record<string, string[]>;
  textOverrides: Record<string, { text?: string; sub?: string; title?: string }>;
  extraBlocks: { afterBlockId: string | null; pageId: string; block: Block }[];
};

export const EMPTY_LAYOUT: ReportLayout = {
  hiddenBlocks: [],
  hiddenTableRows: {},
  hiddenTableCols: {},
  blockOrder: {},
  textOverrides: {},
  extraBlocks: [],
};

export function normalizeLayout(raw: unknown): ReportLayout {
  const l = (raw ?? {}) as Partial<ReportLayout>;
  return {
    hiddenBlocks: Array.isArray(l.hiddenBlocks) ? l.hiddenBlocks : [],
    hiddenTableRows: l.hiddenTableRows && typeof l.hiddenTableRows === "object" ? l.hiddenTableRows : {},
    hiddenTableCols: l.hiddenTableCols && typeof l.hiddenTableCols === "object" ? l.hiddenTableCols : {},
    blockOrder: l.blockOrder && typeof l.blockOrder === "object" ? l.blockOrder : {},
    textOverrides: l.textOverrides && typeof l.textOverrides === "object" ? l.textOverrides : {},
    extraBlocks: Array.isArray(l.extraBlocks) ? l.extraBlocks : [],
  };
}

export function isLayoutEmpty(l: ReportLayout): boolean {
  return (
    l.hiddenBlocks.length === 0 &&
    Object.keys(l.hiddenTableRows).length === 0 &&
    Object.keys(l.hiddenTableCols).length === 0 &&
    Object.keys(l.blockOrder).length === 0 &&
    Object.keys(l.textOverrides).length === 0 &&
    l.extraBlocks.length === 0
  );
}

function applyToBlock(b: Block, layout: ReportLayout): Block | null {
  const id = b.id ?? "";
  const ov = layout.textOverrides[id];
  let out: Block = b;
  if (ov) {
    if (out.type === "h1") out = { ...out, text: ov.text ?? out.text, sub: ov.sub ?? out.sub };
    else if (out.type === "h2" || out.type === "p") out = { ...out, text: ov.text ?? out.text };
    else if (out.type === "note") out = { ...out, text: ov.text ?? out.text, title: ov.title ?? out.title };
    else if (out.type === "custom_waterfall") out = { ...out, title: ov.title ?? ov.text ?? out.title };
    else if (out.type === "kpi_charts") out = { ...out, pillar: ov.text ?? out.pillar };
  }
  if (out.type === "table") {
    const hiddenRows = new Set(layout.hiddenTableRows[id] ?? []);
    const hiddenCols = new Set(layout.hiddenTableCols[id] ?? []);
    let rows = out.rows;
    if (hiddenRows.size) rows = rows.filter((r, i) => !hiddenRows.has(tableRowKey(r, i)));
    let head = out.head;
    let rygColumns = out.rygColumns;
    let pctColumns = out.pctColumns;
    if (hiddenCols.size) {
      const keep = head.map((_, i) => i).filter((i) => !hiddenCols.has(i));
      if (!keep.length) return null;
      const remap = new Map(keep.map((orig, ni) => [orig, ni]));
      head = keep.map((i) => head[i]);
      rows = rows.map((r) => keep.map((i) => r[i] ?? ""));
      rygColumns = (out.rygColumns ?? []).map((c) => remap.get(c)).filter((c): c is number => c != null);
      pctColumns = (out.pctColumns ?? []).map((c) => remap.get(c)).filter((c): c is number => c != null);
    }
    if (!rows.length) return null;
    out = { ...out, head, rows, rygColumns, pctColumns };
  }
  return out;
}

/** Single place where user edits are merged into the generated report. */
export function applyLayout(pages: Page[], layout: ReportLayout): Page[] {
  const hidden = new Set(layout.hiddenBlocks);
  const out: Page[] = [];

  for (const page of pages) {
    const pageId = page.id ?? "";
    let blocks = page.blocks
      .map((b) => (hidden.has(b.id ?? "") ? null : applyToBlock(b, layout)))
      .filter((b): b is Block => b != null);

    // user-added blocks first, so custom ordering can move them too
    const extras = layout.extraBlocks.filter((e) => e.pageId === pageId && !hidden.has(e.block.id ?? ""));
    for (const e of extras) {
      const block = applyToBlock(e.block, layout) ?? e.block;
      if (!e.afterBlockId) blocks = [block, ...blocks];
      else {
        const at = blocks.findIndex((b) => b.id === e.afterBlockId);
        if (at === -1) blocks = [...blocks, block];
        else blocks = [...blocks.slice(0, at + 1), block, ...blocks.slice(at + 1)];
      }
    }

    const order = layout.blockOrder[pageId];
    if (order?.length) {
      const rank = new Map(order.map((id, i) => [id, i]));
      blocks = blocks
        .map((b, i) => ({ b, i }))
        .sort((a, z) => {
          const ra = rank.get(a.b.id ?? "") ?? 1000 + a.i;
          const rz = rank.get(z.b.id ?? "") ?? 1000 + z.i;
          return ra - rz;
        })
        .map((x) => x.b);
    }


    if (page.dark || blocks.length) out.push({ ...page, blocks });
  }
  return out;
}
