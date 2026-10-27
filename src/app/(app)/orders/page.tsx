"use client";

import { Check, Download, MapPin, Minus, Phone, Plus, Printer, ShoppingBag, StickyNote, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ProductThumb } from "@/components/product-thumb";
import { DataTable } from "@/components/ui/data-table";
import { confirmDialog, Drawer, Modal } from "@/components/ui/overlay";
import { Avatar, Badge, Button, Card, Empty, Field, Input, PageHeader, SearchInput, Select, Skeleton, Tabs } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { FLOW, NEXT_ACTION, ORDER_STATUS, PAYMENT, sizeLabel, sizesFor } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { dateTime, num, orderNo, relative, toman } from "@/lib/format";
import { totalStock, useStore } from "@/lib/store";
import type { Order, OrderItem, OrderStatus, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | OrderStatus;

export default function OrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const router = useRouter();
  const params = useSearchParams();
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const custMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const [tab, setTab] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [pay, setPay] = useState<PaymentMethod | "all">("all");
  const [creating, setCreating] = useState(false);
  const openId = params.get("open");
  const current = openId ? orders.find((o) => o.id === openId) : undefined;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    orders.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [orders]);

  const rows = useMemo(() => {
    const t = q.trim().replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    return orders.filter((o) => (tab === "all" || o.status === tab) && (pay === "all" || o.payment === pay) && (!t || String(o.number).includes(t) || (custMap.get(o.customerId)?.name ?? "").includes(t)));
  }, [orders, tab, q, pay, custMap]);

  const open = (id: string | null) => router.replace(id ? `/orders?open=${id}` : "/orders", { scroll: false });

  return (
    <>
      <PageHeader
        title="سفارش‌ها"
        desc={`${num(orders.length)} سفارش ثبت شده`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv("orders.csv", ["شماره", "مشتری", "تاریخ", "وضعیت", "پرداخت", "مبلغ"], rows.map((o) => [o.number, custMap.get(o.customerId)?.name ?? "", dateTime(o.createdAt), ORDER_STATUS[o.status].label, PAYMENT[o.payment], o.total]));
                toast.success("فایل CSV دانلود شد");
              }}
            >
              <Download /> خروجی CSV
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus /> ثبت سفارش دستی
            </Button>
          </>
        }
      />

      <Card>
        <div className="space-y-3 border-b border-line p-4">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "all", label: "همه", count: counts.all },
              ...(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "returned"] as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS[s].label, count: counts[s] ?? 0 })),
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <div className="min-w-48 flex-1 sm:max-w-xs">
              <SearchInput placeholder="شماره سفارش یا نام مشتری…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجو" />
            </div>
            <Select value={pay} onChange={(e) => setPay(e.target.value as PaymentMethod | "all")} className="w-auto min-w-40" aria-label="روش پرداخت">
              <option value="all">همه‌ی روش‌های پرداخت</option>
              {Object.entries(PAYMENT).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DataTable
          rows={rows}
          rowKey={(o) => o.id}
          onRowClick={(o) => open(o.id)}
          empty={<Empty icon={<ShoppingBag />} title="سفارشی پیدا نشد" desc="فیلترها را تغییر دهید." />}
          columns={[
            { key: "n", header: "سفارش", sort: (o) => o.number, cell: (o) => <b>{orderNo(o.number)}</b> },
            {
              key: "c",
              header: "مشتری",
              sort: (o) => custMap.get(o.customerId)?.name ?? "",
              cell: (o) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={custMap.get(o.customerId)?.name ?? "؟"} size={30} />
                  <span className="whitespace-nowrap">{custMap.get(o.customerId)?.name ?? "—"}</span>
                </div>
              ),
            },
            { key: "d", header: "تاریخ", hideBelow: "md", sort: (o) => o.createdAt, cell: (o) => <span className="whitespace-nowrap text-muted">{relative(o.createdAt)}</span> },
            { key: "i", header: "اقلام", hideBelow: "lg", cell: (o) => <span className="text-muted">{num(o.items.reduce((s, i) => s + i.qty, 0))} عدد</span> },
            { key: "p", header: "پرداخت", hideBelow: "lg", cell: (o) => <span className="whitespace-nowrap text-muted">{PAYMENT[o.payment]}</span> },
            { key: "s", header: "وضعیت", sort: (o) => o.status, cell: (o) => <Badge tone={ORDER_STATUS[o.status].tone} dot>{ORDER_STATUS[o.status].label}</Badge> },
            { key: "t", header: "مبلغ", sort: (o) => o.total, className: "text-end", cell: (o) => <b className="whitespace-nowrap">{toman(o.total)}</b> },
          ]}
        />
      </Card>

      <OrderDrawer order={current} onClose={() => open(null)} />
      <CreateOrder open={creating} onClose={() => setCreating(false)} onCreated={(o) => open(o.id)} />
    </>
  );
}

function OrderDrawer({ order, onClose }: { order?: Order; onClose: () => void }) {
  const customer = useStore((s) => s.customers.find((c) => c.id === order?.customerId));
  const { setOrderStatus } = useStore.getState();
  if (!order) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;

  const flowIdx = FLOW.indexOf(order.status);
  const closed = order.status === "cancelled" || order.status === "returned";
  const next = flowIdx >= 0 && flowIdx < FLOW.length - 1 ? FLOW[flowIdx + 1] : null;

  const cancel = async () => {
    const isReturn = order.status === "delivered";
    if (await confirmDialog({ title: isReturn ? "ثبت مرجوعی" : "لغو سفارش", desc: "موجودی کالاها به انبار برمی‌گردد.", confirmText: isReturn ? "ثبت مرجوعی" : "لغو سفارش", danger: true })) {
      setOrderStatus(order.id, isReturn ? "returned" : "cancelled");
      toast.success(isReturn ? "مرجوعی ثبت شد" : "سفارش لغو شد");
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={`سفارش ${orderNo(order.number)}`}
      desc={dateTime(order.createdAt)}
      footer={
        closed ? (
          <>
            <Badge tone={ORDER_STATUS[order.status].tone} className="me-auto self-center">{ORDER_STATUS[order.status].label}</Badge>
            <InvoiceLink id={order.id} />
          </>
        ) : (
          <>
            <InvoiceLink id={order.id} />
            <Button variant="outline" className="text-danger" onClick={cancel}>
              <X /> {order.status === "delivered" ? "ثبت مرجوعی" : "لغو سفارش"}
            </Button>
            {next && (
              <Button
                onClick={() => {
                  setOrderStatus(order.id, next);
                  toast.success(`وضعیت: ${ORDER_STATUS[next].label}`);
                }}
              >
                <Check /> {NEXT_ACTION[order.status]}
              </Button>
            )}
          </>
        )
      }
    >
      <div className="space-y-6">
        {/* stepper */}
        {!closed ? (
          <ol className="flex items-start" aria-label="مراحل سفارش">
            {FLOW.map((s, i) => {
              const done = i <= flowIdx;
              const ev = order.events.find((e) => e.status === s);
              return (
                <li key={s} className="relative flex-1 text-center">
                  {i > 0 && <span className={cn("absolute end-1/2 top-3.5 h-0.5 w-full", i <= flowIdx ? "bg-brand" : "bg-line")} />}
                  <span className={cn("relative mx-auto grid size-7 place-items-center rounded-full text-xs font-bold", done ? "bg-brand text-brand-fg" : "bg-surface-2 text-muted", i === flowIdx && "ring-4 ring-brand/20")}>{done ? <Check className="size-4" /> : num(i + 1)}</span>
                  <span className={cn("mt-2 block text-[11px] leading-4", done ? "font-medium" : "text-muted")}>{ORDER_STATUS[s].label}</span>
                  {ev && <span className="block text-[10px] text-muted">{relative(ev.at)}</span>}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className={cn("rounded-xl p-4 text-sm", order.status === "cancelled" ? "bg-danger-soft text-danger" : "bg-surface-2")}>این سفارش {ORDER_STATUS[order.status].label} است.</div>
        )}

        {/* customer */}
        <section className="rounded-2xl border border-line p-4">
          <div className="flex items-center gap-3">
            <Avatar name={customer?.name ?? "؟"} size={42} />
            <div>
              <p className="font-bold">{customer?.name ?? "مشتری حذف شده"}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Phone className="size-3" /> {customer?.phone}
              </p>
            </div>
            <Badge className="ms-auto">{PAYMENT[order.payment]}</Badge>
          </div>
          <p className="mt-3 flex gap-2 text-[13px] text-muted">
            <MapPin className="mt-0.5 size-4 shrink-0" /> {order.address}
          </p>
          {order.note && (
            <p className="mt-2 flex gap-2 text-[13px] text-muted">
              <StickyNote className="mt-0.5 size-4 shrink-0" /> {order.note}
            </p>
          )}
        </section>

        {/* items */}
        <section>
          <h3 className="mb-2 text-sm font-bold">اقلام سفارش</h3>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center gap-3 p-3">
                <ProductThumb category={it.category} color={it.colorHex} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted">
                    {it.color} · سایز {sizeLabel(it.size)} · {num(it.qty)} عدد
                  </p>
                </div>
                <b className="whitespace-nowrap text-sm">{toman(it.price * it.qty)}</b>
              </li>
            ))}
          </ul>
        </section>

        {/* totals */}
        <section className="space-y-2 rounded-2xl bg-surface-2 p-4 text-sm">
          <Row label="جمع اقلام" value={toman(order.subtotal)} />
          {order.discount > 0 && <Row label={`تخفیف${order.couponCode ? ` (${order.couponCode})` : ""}`} value={<><bdi dir="ltr">−{num(order.discount)}</bdi> تومان</>} tone="text-success" />}
          <Row label="هزینه ارسال" value={order.shipping ? toman(order.shipping) : "رایگان"} />
          <div className="border-t border-line pt-2">
            <Row label="مبلغ نهایی" value={toman(order.total)} bold />
          </div>
        </section>

        {/* history */}
        <section>
          <h3 className="mb-2 text-sm font-bold">تاریخچه</h3>
          <ul className="space-y-2.5 text-[13px]">
            {[...order.events].reverse().map((e, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <i className="size-2 rounded-full bg-brand" />
                <span className="flex-1">{ORDER_STATUS[e.status].label}</span>
                <span className="text-xs text-muted">{dateTime(e.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Drawer>
  );
}

function InvoiceLink({ id }: { id: string }) {
  return (
    <a href={`/invoice/${id}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium transition hover:bg-surface-2 active:scale-[0.97]">
      <Printer className="size-4" /> چاپ فاکتور
    </a>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: React.ReactNode; bold?: boolean; tone?: string }) {
  return (
    <div className={cn("flex justify-between gap-4", bold && "text-base font-extrabold", tone)}>
      <span className={bold ? "" : "text-muted"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* ---------------- manual order ---------------- */
function CreateOrder({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (o: Order) => void }) {
  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const [customerId, setCustomerId] = useState("");
  const [pay, setPay] = useState<PaymentMethod>("online");
  const [coupon, setCoupon] = useState("");
  const [lines, setLines] = useState<OrderItem[]>([]);
  const [pid, setPid] = useState("");
  const [size, setSize] = useState("");

  const sellable = useMemo(() => products.filter((p) => p.status === "active" && totalStock(p) > 0), [products]);
  const picked = sellable.find((p) => p.id === pid);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const reset = () => {
    setCustomerId("");
    setLines([]);
    setPid("");
    setSize("");
    setCoupon("");
    setPay("online");
  };
  const close = () => {
    reset();
    onClose();
  };

  const addLine = () => {
    if (!picked || !size) return;
    const sz = size as OrderItem["size"];
    const stock = picked.stock[sz] ?? 0;
    const inCart = lines.find((l) => l.productId === picked.id && l.size === sz);
    if ((inCart?.qty ?? 0) + 1 > stock) {
      toast.error("موجودی این سایز کافی نیست");
      return;
    }
    if (inCart) setLines(lines.map((l) => (l === inCart ? { ...l, qty: l.qty + 1 } : l)));
    else setLines([...lines, { productId: picked.id, name: picked.name, category: picked.category, size: sz, color: picked.colors[0].name, colorHex: picked.colors[0].hex, qty: 1, price: picked.salePrice ?? picked.price }]);
  };

  const submit = () => {
    const o = useStore.getState().createOrder({ customerId, items: lines, payment: pay, couponCode: coupon.trim() || undefined });
    if (!o) return;
    toast.success(`سفارش ${orderNo(o.number)} ثبت شد`);
    close();
    onCreated(o);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="ثبت سفارش دستی"
      desc="مناسب سفارش‌های تلفنی یا حضوری"
      width="max-w-2xl"
      footer={
        <>
          <span className="me-auto self-center text-sm">
            جمع: <b>{toman(total)}</b>
          </span>
          <Button variant="outline" onClick={close}>
            انصراف
          </Button>
          <Button disabled={!customerId || !lines.length} onClick={submit}>
            ثبت سفارش
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="مشتری">
            {(id) => (
              <Select id={id} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">انتخاب مشتری…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.city}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="روش پرداخت">
            {(id) => (
              <Select id={id} value={pay} onChange={(e) => setPay(e.target.value as PaymentMethod)}>
                {Object.entries(PAYMENT).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="rounded-2xl border border-line p-4">
          <p className="mb-3 text-sm font-bold">افزودن کالا</p>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="محصول" className="min-w-48 flex-1">
              {(id) => (
                <Select
                  id={id}
                  value={pid}
                  onChange={(e) => {
                    setPid(e.target.value);
                    setSize("");
                  }}
                >
                  <option value="">انتخاب محصول…</option>
                  {sellable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="سایز" className="w-32">
              {(id) => (
                <Select id={id} value={size} onChange={(e) => setSize(e.target.value)} disabled={!picked}>
                  <option value="">—</option>
                  {picked &&
                    sizesFor(picked.category)
                      .filter((s) => (picked.stock[s] ?? 0) > 0)
                      .map((s) => (
                        <option key={s} value={s}>
                          {sizeLabel(s)} ({num(picked.stock[s] ?? 0)})
                        </option>
                      ))}
                </Select>
              )}
            </Field>
            <Button variant="secondary" onClick={addLine} disabled={!picked || !size}>
              <Plus /> افزودن
            </Button>
          </div>

          {lines.length > 0 && (
            <ul className="mt-4 divide-y divide-line">
              {lines.map((l, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <ProductThumb category={l.category} color={l.colorHex} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted">سایز {sizeLabel(l.size)} · {toman(l.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="size-8 px-0" aria-label="کم کردن" onClick={() => setLines(lines.map((x, j) => (j === i ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0))}>
                      <Minus />
                    </Button>
                    <span className="w-7 text-center text-sm font-bold">{num(l.qty)}</span>
                    <Button size="sm" variant="outline" className="size-8 px-0" aria-label="زیاد کردن" onClick={() => setLines(lines.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x)))}>
                      <Plus />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Field label="کد تخفیف (اختیاری)" hint="مثلاً WELCOME10">
          {(id) => <Input id={id} value={coupon} onChange={(e) => setCoupon(e.target.value)} dir="ltr" className="text-end uppercase" />}
        </Field>
      </div>
    </Modal>
  );
}
