import { Briefcase, Footprints, Glasses, Shirt, ShoppingBag, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON: Record<Category, LucideIcon> = {
  shirt: Shirt,
  tshirt: Shirt,
  pants: Shirt,
  jacket: Briefcase,
  dress: Shirt,
  shoes: Footprints,
  bag: ShoppingBag,
  accessory: Glasses,
};

/** Is the hex colour light? Used to pick icon contrast. */
function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

/** Placeholder product visual: a tinted tile with a garment icon. No network needed. */
export function ProductThumb({ category, color = "#178168", className, size = 44 }: { category: Category; color?: string; className?: string; size?: number | "fill" }) {
  const Icon = ICON[category];
  const light = isLight(color);
  return (
    <span
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl", className)}
      style={{ ...(size === "fill" ? {} : { width: size, height: size }), background: `linear-gradient(145deg, ${color}, color-mix(in oklab, ${color} 70%, ${light ? "#000" : "#fff"}))` }}
      aria-hidden
    >
      <Icon strokeWidth={1.6} style={{ width: size === "fill" ? 56 : size * 0.5, height: size === "fill" ? 56 : size * 0.5, color: light ? "rgb(0 0 0 / .55)" : "rgb(255 255 255 / .85)" }} />
    </span>
  );
}
