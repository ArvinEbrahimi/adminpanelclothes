import { DAY } from "./format";
import type { Category, Customer, Order, Product } from "./types";

/** Orders that count as real revenue */
export const isRevenue = (o: Order) => o.status !== "cancelled" && o.status !== "returned" && o.status !== "pending";

export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function inRange(orders: Order[], from: number, to: number) {
  return orders.filter((o) => o.createdAt >= from && o.createdAt < to);
}

export interface Kpi {
  value: number;
  prev: number;
  delta: number;
  spark: number[];
}

function delta(v: number, p: number) {
  return p === 0 ? (v > 0 ? 100 : 0) : ((v - p) / p) * 100;
}

function dailySeries(orders: Order[], from: number, days: number, fn: (os: Order[]) => number) {
  return Array.from({ length: days }, (_, i) => {
    const a = from + i * DAY;
    return fn(inRange(orders, a, a + DAY));
  });
}

export function kpis(orders: Order[], customers: Customer[], days: number, now = Date.now()) {
  const end = startOfDay(now) + DAY;
  const from = end - days * DAY;
  const prevFrom = from - days * DAY;
  const cur = inRange(orders, from, end);
  const prev = inRange(orders, prevFrom, from);
  const rev = (os: Order[]) => os.filter(isRevenue).reduce((s, o) => s + o.total, 0);
  const cnt = (os: Order[]) => os.length;
  const avg = (os: Order[]) => {
    const r = os.filter(isRevenue);
    return r.length ? rev(r) / r.length : 0;
  };
  const newCust = (a: number, b: number) => customers.filter((c) => c.joinedAt >= a && c.joinedAt < b).length;

  const mk = (value: number, p: number, fn: (os: Order[]) => number): Kpi => ({ value, prev: p, delta: delta(value, p), spark: dailySeries(orders, from, days, fn) });
  const customersSpark = Array.from({ length: days }, (_, i) => newCust(from + i * DAY, from + (i + 1) * DAY));
  return {
    revenue: mk(rev(cur), rev(prev), rev),
    orders: mk(cnt(cur), cnt(prev), cnt),
    avg: mk(avg(cur), avg(prev), avg),
    customers: { value: newCust(from, end), prev: newCust(prevFrom, from), delta: delta(newCust(from, end), newCust(prevFrom, from)), spark: customersSpark } as Kpi,
  };
}

/** revenue per day for current period and previous period aligned */
export function revenueSeries(orders: Order[], days: number, now = Date.now()) {
  const end = startOfDay(now) + DAY;
  const from = end - days * DAY;
  const rev = (os: Order[]) => os.filter(isRevenue).reduce((s, o) => s + o.total, 0);
  return Array.from({ length: days }, (_, i) => {
    const a = from + i * DAY;
    return { t: a, current: rev(inRange(orders, a, a + DAY)), previous: rev(inRange(orders, a - days * DAY, a - (days - 1) * DAY)) };
  });
}

export function topProducts(orders: Order[], products: Product[], from: number, limit = 6) {
  const map = new Map<string, { qty: number; revenue: number }>();
  orders.filter((o) => isRevenue(o) && o.createdAt >= from).forEach((o) =>
    o.items.forEach((i) => {
      const m = map.get(i.productId) ?? { qty: 0, revenue: 0 };
      m.qty += i.qty;
      m.revenue += i.qty * i.price;
      map.set(i.productId, m);
    }),
  );
  return [...map.entries()]
    .map(([id, v]) => ({ product: products.find((p) => p.id === id), ...v }))
    .filter((x): x is { product: Product; qty: number; revenue: number } => !!x.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function byCategory(orders: Order[], from: number) {
  const map = new Map<Category, number>();
  orders.filter((o) => isRevenue(o) && o.createdAt >= from).forEach((o) => o.items.forEach((i) => map.set(i.category, (map.get(i.category) ?? 0) + i.qty * i.price)));
  return [...map.entries()].map(([category, revenue]) => ({ category, revenue })).sort((a, b) => b.revenue - a.revenue);
}

export function customerStats(customers: Customer[], orders: Order[]) {
  const map = new Map<string, { orders: number; spent: number; last: number }>();
  orders.forEach((o) => {
    const m = map.get(o.customerId) ?? { orders: 0, spent: 0, last: 0 };
    if (isRevenue(o)) {
      m.orders += 1;
      m.spent += o.total;
    }
    m.last = Math.max(m.last, o.createdAt);
    map.set(o.customerId, m);
  });
  return customers.map((c) => ({ ...c, ...(map.get(c.id) ?? { orders: 0, spent: 0, last: 0 }) }));
}

export type Tier = { key: "gold" | "silver" | "bronze" | "new"; label: string };
export function tierOf(spent: number, orders: number): Tier {
  if (spent >= 15_000_000) return { key: "gold", label: "طلایی" };
  if (spent >= 6_000_000) return { key: "silver", label: "نقره‌ای" };
  if (orders >= 1) return { key: "bronze", label: "برنزی" };
  return { key: "new", label: "جدید" };
}
