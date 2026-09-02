import {
  AlertTriangle, BadgeCheck, Boxes, CircleDot, ClipboardCheck, Coins, Factory, Gauge,
  Leaf, Recycle, ShieldCheck, Sparkles, Truck, Users, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "ShieldCheck", label: "Safety", Icon: ShieldCheck },
  { name: "Users", label: "People", Icon: Users },
  { name: "BadgeCheck", label: "Quality", Icon: BadgeCheck },
  { name: "Truck", label: "Delivery", Icon: Truck },
  { name: "Coins", label: "Cost", Icon: Coins },
  { name: "Gauge", label: "Performance", Icon: Gauge },
  { name: "Wrench", label: "Maintenance", Icon: Wrench },
  { name: "Boxes", label: "Inventory", Icon: Boxes },
  { name: "Factory", label: "Production", Icon: Factory },
  { name: "ClipboardCheck", label: "Compliance", Icon: ClipboardCheck },
  { name: "Leaf", label: "Environment", Icon: Leaf },
  { name: "Recycle", label: "Sustainability", Icon: Recycle },
  { name: "Sparkles", label: "Improvement", Icon: Sparkles },
  { name: "AlertTriangle", label: "Risk", Icon: AlertTriangle },
  { name: "CircleDot", label: "Generic", Icon: CircleDot },
];

export const CATEGORY_ACCENTS: { value: string; label: string }[] = [
  { value: "text-red-600", label: "Red" },
  { value: "text-sky-600", label: "Blue" },
  { value: "text-violet-600", label: "Violet" },
  { value: "text-amber-600", label: "Amber" },
  { value: "text-emerald-600", label: "Green" },
  { value: "text-slate-600", label: "Slate" },
];

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const entry = CATEGORY_ICONS.find(i => i.name === name);
  const Icon = entry?.Icon ?? CircleDot;
  return <Icon className={className} />;
}
