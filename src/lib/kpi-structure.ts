// Shared mapping between KPI structure input fields and database columns.

export type KpiStructureInput = {
  code?: string | null;
  libraryKey?: string | null;
  category?: string | null;
  hierarchyLevel?: number | null;
  indicatorType?: string | null;
  formula?: string | null;
  purpose?: string | null;
  dataSource?: string | null;
  scope?: string | null;
  exclusions?: string | null;
  reportingLevel?: string | null;
};

export function structurePatch(d: KpiStructureInput) {
  return {
    ...(d.code !== undefined && { code: d.code }),
    ...(d.libraryKey !== undefined && { library_key: d.libraryKey }),
    ...(d.category !== undefined && { category: d.category }),
    ...(d.hierarchyLevel !== undefined && { hierarchy_level: d.hierarchyLevel }),
    ...(d.indicatorType !== undefined && { indicator_type: d.indicatorType }),
    ...(d.formula !== undefined && { formula: d.formula }),
    ...(d.purpose !== undefined && { purpose: d.purpose }),
    ...(d.dataSource !== undefined && { data_source: d.dataSource }),
    ...(d.scope !== undefined && { scope: d.scope }),
    ...(d.exclusions !== undefined && { exclusions: d.exclusions }),
    ...(d.reportingLevel !== undefined && { reporting_level: d.reportingLevel }),
  };
}
