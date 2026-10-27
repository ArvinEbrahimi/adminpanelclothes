"use client";

import { num, toman } from "@/lib/format";

interface Payload {
  name?: string | number;
  dataKey?: string | number;
  value?: number | string;
  color?: string;
}

interface Props {
  // injected by recharts
  active?: boolean;
  payload?: Payload[];
  label?: string | number;
  // ours
  names?: Record<string, string>;
  money?: boolean;
  labelFn?: (l: string | number) => string;
}

export function ChartTooltip({ active, payload, label, names, money, labelFn }: Props) {
  if (!active || !payload?.length) return null;
  return (
    <div dir="rtl" className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs shadow-lg">
      {label !== undefined && label !== "" && <p className="mb-1.5 font-bold">{labelFn ? labelFn(label) : String(label)}</p>}
      <ul className="space-y-1">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <i className="size-2 rounded-full" style={{ background: p.color ?? "var(--brand)" }} />
            <span className="text-muted">{names?.[String(p.dataKey)] ?? String(p.name ?? "")}</span>
            <b className="ms-auto ps-3">{money ? toman(Number(p.value)) : num(Number(p.value))}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
