"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "./ui/primitives";

export function StatCard({ label, value, delta, spark, icon, hint }: { label: string; value: ReactNode; delta?: number; spark?: number[]; icon: ReactNode; hint?: string }) {
  const up = (delta ?? 0) >= 0;
  const data = spark?.map((v, i) => ({ i, v }));
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-muted">{label}</p>
          <p className="mt-2 truncate text-2xl font-extrabold tracking-tight">{value}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink [&_svg]:size-5">{icon}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-xs">
          {delta !== undefined && (
            <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold", up ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
              {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
              {pct(Math.abs(delta))}
            </span>
          )}
          <span className="ms-1.5 text-muted">{hint ?? "نسبت به دوره قبل"}</span>
        </div>
        {data && (
          <div className="h-9 w-24 shrink-0" aria-hidden>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id={`sp-${label}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="var(--brand)" strokeWidth={1.8} fill={`url(#sp-${label})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
