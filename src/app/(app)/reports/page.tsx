"use client";

import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/chart-tooltip";
import { Button, Card, CardHeader, PageHeader, Tabs } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { byCategory, isRevenue, topProducts } from "@/lib/analytics";
import { CATEGORIES, PAYMENT } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { DAY, compact, monthName, num, toman } from "@/lib/format";
import { useStore } from "@/lib/store";

const COLORS = ["var(--brand)", "#e8a33d", "#4f8fd6", "#c2554b", "#8b8f94", "#7a63c9", "#3aa6a0", "#d4719a"];
const WEEK = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const RANGES = [
  { value: "30", label: "۳۰ روز" },
  { value: "90", label: "۹۰ روز" },
  { value: "180", label: "۶ ماه" },
] as const;

export default function ReportsPage() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const [range, setRange] = useState<"30" | "90" | "180">("90");
  const [now] = useState(Date.now);
  const from = now - Number(range) * DAY;
  const real = useMemo(() => orders.filter((o) => isRevenue(o) && o.createdAt >= from), [orders, from]);

  const monthly = useMemo(() => {
    const m = new Map<string, { label: string; revenue: number; orders: number; t: number }>();
    real.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = monthName(o.createdAt);
      const cur = m.get(key) ?? { label: key, revenue: 0, orders: 0, t: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
      cur.revenue += o.total;
      cur.orders += 1;
      m.set(key, cur);
    });
    return [...m.values()].sort((a, b) => a.t - b.t);
  }, [real]);

  const weekday = useMemo(() => {
    const arr = WEEK.map((day) => ({ day, revenue: 0 }));
    real.forEach((o) => (arr[new Date(o.createdAt).getDay()].revenue += o.total));
    return arr;
  }, [real]);

  const cats = useMemo(() => byCategory(orders, from).map((c) => ({ name: CATEGORIES[c.category], value: c.revenue })), [orders, from]);
  const payments = useMemo(() => {
    const m = new Map<string, number>();
    real.forEach((o) => m.set(o.payment, (m.get(o.payment) ?? 0) + 1));
    return [...m.entries()].map(([k, v]) => ({ name: PAYMENT[k as keyof typeof PAYMENT], value: v }));
  }, [real]);
  const cities = useMemo(() => {
    const m = new Map<string, number>();
    real.forEach((o) => m.set(o.city, (m.get(o.city) ?? 0) + o.total));
    return [...m.entries()].map(([city, revenue]) => ({ city, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 7);
  }, [real]);
  const tops = useMemo(() => topProducts(orders, products, from, 8), [orders, products, from]);

  const totals = useMemo(() => {
    const revenue = real.reduce((s, o) => s + o.total, 0);
    const profit = real.reduce((s, o) => s + o.items.reduce((a, i) => a + (i.price - (products.find((p) => p.id === i.productId)?.cost ?? i.price * 0.55)) * i.qty, 0), 0);
    return { revenue, profit, count: real.length };
  }, [real, products]);

  return (
    <>
      <PageHeader
        title="گزارش‌ها"
        desc="تحلیل فروش، محصولات و رفتار مشتریان"
        actions={
          <>
            <Tabs value={range} onChange={setRange} items={RANGES.map((r) => ({ ...r }))} />
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv("sales-report.csv", ["ماه", "تعداد سفارش", "فروش (تومان)"], monthly.map((m) => [m.label, m.orders, m.revenue]));
                toast.success("گزارش دانلود شد");
              }}
            >
              <Download /> دانلود گزارش
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["فروش خالص", toman(totals.revenue)],
          ["سود تخمینی", toman(totals.profit)],
          ["سفارش‌های موفق", num(totals.count)],
        ].map(([l, v]) => (
          <Card key={l} className="p-5">
            <p className="text-[13px] text-muted">{l}</p>
            <p className="mt-2 text-2xl font-extrabold">{v}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="فروش ماهانه" />
          <div className="h-72 p-3 pt-6" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip money names={{ revenue: "فروش" }} />} />
                <Bar dataKey="revenue" fill="var(--brand)" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="تعداد سفارش در ماه" />
          <div className="h-72 p-3 pt-6" dir="ltr">
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<ChartTooltip names={{ orders: "سفارش" }} />} />
                <Line type="monotone" dataKey="orders" stroke="#e8a33d" strokeWidth={2.6} dot={{ r: 4, fill: "var(--surface)", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="فروش بر اساس روز هفته" desc="پنجشنبه و جمعه معمولاً اوج فروش است" />
          <div className="h-72 p-3 pt-6" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={weekday}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} interval={0} fontSize={11} />
                <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip money names={{ revenue: "فروش" }} />} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={40}>
                  {weekday.map((w, i) => (
                    <Cell key={i} fill={w.revenue === Math.max(...weekday.map((x) => x.revenue)) ? "var(--brand)" : "var(--brand-soft)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="شهرهای پرفروش" />
          <div className="h-72 p-3 pt-6" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={cities} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={compact} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="city" tickLine={false} axisLine={false} width={64} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip money names={{ revenue: "فروش" }} />} />
                <Bar dataKey="revenue" fill="#4f8fd6" radius={[0, 8, 8, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="سهم دسته‌ها از فروش" />
          <DonutBlock data={cats} money />
        </Card>
        <Card>
          <CardHeader title="روش‌های پرداخت" />
          <DonutBlock data={payments} />
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="پرفروش‌ترین محصولات" />
          <div className="overflow-x-auto p-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="p-3 text-start font-medium">#</th>
                  <th className="p-3 text-start font-medium">محصول</th>
                  <th className="p-3 text-start font-medium">تعداد فروش</th>
                  <th className="p-3 text-end font-medium">درآمد</th>
                </tr>
              </thead>
              <tbody>
                {tops.map((t, i) => (
                  <tr key={t.product.id} className="border-b border-line/60 last:border-0">
                    <td className="p-3 text-muted">{num(i + 1)}</td>
                    <td className="p-3 font-medium">{t.product.name}</td>
                    <td className="p-3">{num(t.qty)}</td>
                    <td className="p-3 text-end font-bold">{toman(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function DonutBlock({ data, money }: { data: { name: string; value: number }[]; money?: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="flex flex-wrap items-center gap-4 p-5 sm:flex-nowrap">
      <div className="mx-auto h-48 w-48 shrink-0" dir="ltr">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={52} outerRadius={86} paddingAngle={2} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip money={money} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-[13px]">
        {data.slice(0, 7).map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <i className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate">{d.name}</span>
            <b>{num((d.value / total) * 100)}٪</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
