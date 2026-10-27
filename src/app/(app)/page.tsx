"use client";

import { AlertTriangle, ArrowLeft, CircleDollarSign, ShoppingBag, UserPlus, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ProductThumb } from "@/components/product-thumb";
import { StatCard } from "@/components/stat-card";
import { Badge, Button, Card, CardHeader, PageHeader, Progress, Tabs } from "@/components/ui/primitives";
import { byCategory, customerStats, kpis, revenueSeries, topProducts } from "@/lib/analytics";
import { CATEGORIES, ORDER_STATUS, sizeLabel } from "@/lib/constants";
import { DAY, compact, num, orderNo, relative, shortDate, toman } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import { ChartTooltip } from "@/components/chart-tooltip";

const RANGES = [
  { value: "7", label: "۷ روز اخیر" },
  { value: "30", label: "۳۰ روز اخیر" },
  { value: "90", label: "۹۰ روز اخیر" },
] as const;

const PIE_COLORS = ["var(--brand)", "#e8a33d", "#4f8fd6", "#c2554b", "#8b8f94", "#7a63c9", "#3aa6a0", "#d4719a"];

export default function DashboardPage() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const activity = useStore((s) => s.activity);
  const threshold = useStore((s) => s.settings.lowStockThreshold);
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const days = Number(range);
  const [now] = useState(Date.now);

  const k = useMemo(() => kpis(orders, customers, days, now), [orders, customers, days, now]);
  const series = useMemo(() => revenueSeries(orders, days, now), [orders, days, now]);
  const cats = useMemo(() => byCategory(orders, now - days * DAY), [orders, days, now]);
  const tops = useMemo(() => topProducts(orders, products, now - days * DAY, 5), [orders, products, days, now]);
  const statusData = useMemo(() => {
    const since = now - days * DAY;
    const m = new Map<OrderStatus, number>();
    orders.filter((o) => o.createdAt >= since).forEach((o) => m.set(o.status, (m.get(o.status) ?? 0) + 1));
    return [...m.entries()].map(([status, value]) => ({ status, name: ORDER_STATUS[status].label, value }));
  }, [orders, days, now]);
  const recent = orders.slice(0, 6);
  const custMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const low = useMemo(
    () =>
      products
        .filter((p) => p.status === "active")
        .flatMap((p) => Object.entries(p.stock).map(([size, qty]) => ({ p, size: size as keyof typeof p.stock, qty: qty ?? 0 })))
        .filter((x) => x.qty <= threshold)
        .sort((a, b) => a.qty - b.qty)
        .slice(0, 5),
    [products, threshold],
  );
  const topCustomers = useMemo(() => customerStats(customers, orders).sort((a, b) => b.spent - a.spent).slice(0, 4), [customers, orders]);
  const totalCat = cats.reduce((s, c) => s + c.revenue, 0) || 1;

  return (
    <>
      <PageHeader
        title="داشبورد"
        desc="خلاصه‌ی عملکرد فروشگاه شما در یک نگاه"
        actions={
          <>
            <Tabs value={range} onChange={setRange} items={RANGES.map((r) => ({ value: r.value, label: r.label }))} />
            <Link href="/products/new">
              <Button>افزودن محصول</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="فروش کل" value={toman(k.revenue.value)} delta={k.revenue.delta} spark={k.revenue.spark} icon={<CircleDollarSign />} />
        <StatCard label="تعداد سفارش" value={num(k.orders.value)} delta={k.orders.delta} spark={k.orders.spark} icon={<ShoppingBag />} />
        <StatCard label="میانگین ارزش سفارش" value={toman(k.avg.value)} delta={k.avg.delta} spark={k.avg.spark} icon={<Wallet />} />
        <StatCard label="مشتری جدید" value={num(k.customers.value)} delta={k.customers.delta} spark={k.customers.spark} icon={<UserPlus />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="روند فروش"
            desc={`مقایسه با ${num(days)} روز قبل از آن`}
            action={
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <i className="size-2.5 rounded-full bg-brand" /> دوره‌ی جاری
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-2.5 rounded-full bg-muted/40" /> دوره‌ی قبل
                </span>
              </div>
            }
          />
          <div className="h-72 p-3 pe-5 pt-6" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ left: 0, right: 0, top: 4 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={days > 30 ? 40 : 20} />
                <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48} />
                <Tooltip content={<ChartTooltip labelFn={(l) => shortDate(Number(l))} names={{ current: "دوره‌ی جاری", previous: "دوره‌ی قبل" }} money />} />
                <Area type="monotone" dataKey="previous" stroke="var(--muted)" strokeOpacity={0.5} strokeDasharray="4 4" fill="none" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="current" stroke="var(--brand)" fill="url(#gRev)" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="وضعیت سفارش‌ها" desc="توزیع در بازه‌ی انتخابی" />
          <div className="flex items-center gap-2 p-4 pt-2">
            <div className="h-44 w-44 shrink-0" dir="ltr">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="min-w-0 flex-1 space-y-2 text-[13px]">
              {statusData.map((s, i) => (
                <li key={s.status} className="flex items-center gap-2">
                  <i className="size-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <b>{num(s.value)}</b>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="پرفروش‌ترین محصولات" action={<Link href="/products" className="flex items-center gap-1 text-xs font-medium text-brand">همه <ArrowLeft className="size-3" /></Link>} />
          <ul className="p-3">
            {tops.map((t, i) => (
              <li key={t.product.id}>
                <Link href={`/products/${t.product.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-2">
                  <span className="w-4 text-center text-xs font-bold text-muted">{num(i + 1)}</span>
                  <ProductThumb category={t.product.category} color={t.product.colors[0]?.hex} size={42} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{t.product.name}</span>
                    <span className="block text-xs text-muted">{num(t.qty)} فروش</span>
                  </span>
                  <span className="text-sm font-bold">{compact(t.revenue)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="فروش به تفکیک دسته" desc="سهم هر دسته از درآمد" />
          <ul className="space-y-3.5 p-5">
            {cats.slice(0, 6).map((c) => (
              <li key={c.category}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span>{CATEGORIES[c.category]}</span>
                  <span className="font-bold">{num((c.revenue / totalCat) * 100)}٪</span>
                </div>
                <Progress value={(c.revenue / totalCat) * 100} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="هشدار موجودی" desc={`سایزهای با موجودی ${num(threshold)} عدد یا کمتر`} action={<AlertTriangle className="size-5 text-warn" />} />
          <ul className="p-3">
            {low.length === 0 && <li className="p-6 text-center text-sm text-muted">همه‌چیز مرتب است ✨</li>}
            {low.map(({ p, size, qty }) => (
              <li key={p.id + size}>
                <Link href="/inventory" className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-2">
                  <ProductThumb category={p.category} color={p.colors[0]?.hex} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block text-xs text-muted">سایز {sizeLabel(size)}</span>
                  </span>
                  <Badge tone={qty === 0 ? "danger" : "warn"}>{qty === 0 ? "ناموجود" : `${num(qty)} عدد`}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="آخرین سفارش‌ها" action={<Link href="/orders" className="flex items-center gap-1 text-xs font-medium text-brand">مشاهده همه <ArrowLeft className="size-3" /></Link>} />
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm">
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-line/60 last:border-0">
                    <td className="p-3">
                      <Link href={`/orders?open=${o.id}`} className="font-bold hover:text-brand">
                        {orderNo(o.number)}
                      </Link>
                    </td>
                    <td className="p-3">{custMap.get(o.customerId)?.name ?? "—"}</td>
                    <td className="hidden p-3 text-muted sm:table-cell">{relative(o.createdAt)}</td>
                    <td className="p-3">
                      <Badge tone={ORDER_STATUS[o.status].tone} dot>
                        {ORDER_STATUS[o.status].label}
                      </Badge>
                    </td>
                    <td className="p-3 text-end font-bold">{toman(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="مشتریان برتر" />
            <ul className="p-3">
              {topCustomers.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl p-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block text-xs text-muted">{num(c.orders)} سفارش · {c.city}</span>
                  </span>
                  <b className="text-sm">{compact(c.spent)}</b>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="فعالیت‌های اخیر" />
            <ul className="space-y-3 p-5 text-[13px]">
              {activity.slice(0, 5).map((a) => (
                <li key={a.id} className="flex gap-2.5">
                  <i className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="flex-1">{a.text}</span>
                  <span className="shrink-0 text-xs text-muted">{relative(a.at)}</span>
                </li>
              ))}
              {activity.length === 0 && <li className="text-muted">فعالیتی ثبت نشده است.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
