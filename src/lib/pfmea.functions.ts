import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generatePfmeaRows } from "@/lib/pfmea.server";

const schema = z.object({
  partNumber: z.string().min(1).max(120),
  partName: z.string().max(200).nullish(),
  customer: z.string().max(200).nullish(),
  program: z.string().max(200).nullish(),
  processFamily: z.string().min(1).max(60),
  specialCharacteristics: z.string().max(2000).nullish(),
  notes: z.string().max(4000).nullish(),
  steps: z
    .array(z.object({ step_no: z.string().max(20).nullish(), step_name: z.string().min(1).max(300) }))
    .max(60)
    .default([]),
  depth: z.enum(["lean", "standard", "thorough"]).default("standard"),
  fileDataUrl: z.string().max(14_000_000).nullish(),
  fileName: z.string().max(300).nullish(),
  fileMime: z.string().max(120).nullish(),
  extractStepsFromFile: z.boolean().default(false),
});

export const draftPfmea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const rows = await generatePfmeaRows(data);
    return { rows };
  });
