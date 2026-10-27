"use client";

import { Mail, MapPin, Pencil, Phone, Plus, Trash2, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { confirmDialog, Drawer, Modal } from "@/components/ui/overlay";
import { Avatar, Badge, Button, Card, Empty, Field, Input, PageHeader, SearchInput, Select, Skeleton, Tabs, Textarea } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { customerStats, tierOf } from "@/lib/analytics";
import { CITIES, ORDER_STATUS } from "@/lib/constants";
import { date, num, orderNo, relative, toman } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";
import { uid } from "@/lib/utils";
import type { Tone } from "@/lib/constants";

const TIER_TONE: Record<string, Tone> = { gold: "warn", silver: "info", bronze: "brand", new: "neutral" };

export default function CustomersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Customers />
    </Suspense>
  );
}

function Customers() {
  const router = useRouter();
  const params = useSearchParams();
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("all");
  const [editing, setEditing] = useState<Customer | null>(null);

  const stats = useMemo(() => customerStats(customers, orders).map((c) => ({ ...c, tier: tierOf(c.spent, c.orders) })), [customers, orders]);
  const rows = useMemo(() => {
    const t = q.trim();
    return stats.filter((c) => (tier === "all" || c.tier.key === tier) && (!t || c.name.includes(t) || c.phone.includes(t) || c.city.includes(t)));
  }, [stats, q, tier]);
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: stats.length };
    stats.forEach((c) => (m[c.tier.key] = (m[c.tier.key] ?? 0) + 1));
    return m;
  }, [stats]);

  const openId = params.get("open");
  const current = stats.find((c) => c.id === openId);
  const setOpen = (id: string | null) => router.replace(id ? `/customers?open=${id}` : "/customers", { scroll: false });

  const remove = async (c: Customer) => {
    if (await confirmDialog({ title: "حذف مشتری", desc: `«${c.name}» حذف می‌شود. سفارش‌های قبلی او در سیستم می‌مانند.`, confirmText: "حذف", danger: true })) {
      useStore.getState().deleteCustomer(c.id);
      setOpen(null);
      toast.success("مشتری حذف شد");
    }
  };

  return (
    <>
      <PageHeader
        title="مشتریان"
        desc={`${num(customers.length)} مشتری ثبت‌شده`}
        actions={
          <Button onClick={() => setEditing({ id: "c" + uid(), name: "", phone: "", email: "", city: "تهران", joinedAt: Date.now() })}>
            <Plus /> مشتری جدید
          </Button>
        }
      />
      <Card>
        <div className="space-y-3 border-b border-line p-4">
          <Tabs
            value={tier}
            onChange={setTier}
            items={[
              { value: "all", label: "همه", count: counts.all },
              { value: "gold", label: "طلایی", count: counts.gold ?? 0 },
              { value: "silver", label: "نقره‌ای", count: counts.silver ?? 0 },
              { value: "bronze", label: "برنزی", count: counts.bronze ?? 0 },
              { value: "new", label: "جدید", count: counts.new ?? 0 },
            ]}
          />
          <div className="max-w-xs">
            <SearchInput placeholder="نام، موبایل یا شهر…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجو" />
          </div>
        </div>
        <DataTable
          rows={rows}
          rowKey={(c) => c.id}
          onRowClick={(c) => setOpen(c.id)}
          empty={<Empty icon={<Users />} title="مشتری‌ای پیدا نشد" />}
          columns={[
            {
              key: "n",
              header: "مشتری",
              sort: (c) => c.name,
              cell: (c) => (
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div>
                    <p className="whitespace-nowrap font-medium">{c.name}</p>
                    <p className="text-xs text-muted">{c.phone}</p>
                  </div>
                </div>
              ),
            },
            { key: "city", header: "شهر", hideBelow: "md", sort: (c) => c.city, cell: (c) => <span className="text-muted">{c.city}</span> },
            { key: "o", header: "سفارش‌ها", hideBelow: "sm", sort: (c) => c.orders, cell: (c) => num(c.orders) },
            { key: "s", header: "مجموع خرید", sort: (c) => c.spent, cell: (c) => <b className="whitespace-nowrap">{toman(c.spent)}</b> },
            { key: "l", header: "آخرین خرید", hideBelow: "lg", sort: (c) => c.last, cell: (c) => <span className="whitespace-nowrap text-muted">{c.last ? relative(c.last) : "—"}</span> },
            { key: "t", header: "سطح", sort: (c) => c.spent, cell: (c) => <Badge tone={TIER_TONE[c.tier.key]}>{c.tier.label}</Badge> },
          ]}
        />
      </Card>

      <Drawer
        open={!!current}
        onClose={() => setOpen(null)}
        title={current?.name ?? ""}
        desc={current ? `عضویت از ${date(current.joinedAt)}` : ""}
        footer={
          current && (
            <>
              <Button variant="outline" className="text-danger" onClick={() => remove(current)}>
                <Trash2 /> حذف
              </Button>
              <Button variant="outline" onClick={() => setEditing(current)}>
                <Pencil /> ویرایش
              </Button>
            </>
          )
        }
      >
        {current && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={current.name} size={56} />
              <div className="space-y-1 text-sm text-muted">
                <Badge tone={TIER_TONE[current.tier.key]}>مشتری {current.tier.label}</Badge>
                <p className="flex items-center gap-1.5"><Phone className="size-3.5" /> {current.phone}</p>
                <p className="flex items-center gap-1.5"><Mail className="size-3.5" /> <span dir="ltr">{current.email}</span></p>
                <p className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {current.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["سفارش‌ها", num(current.orders)],
                ["مجموع خرید", toman(current.spent)],
                ["میانگین", toman(current.orders ? current.spent / current.orders : 0)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-surface-2 p-3 text-center">
                  <p className="text-xs text-muted">{l}</p>
                  <p className="mt-1 text-sm font-extrabold">{v}</p>
                </div>
              ))}
            </div>
            {current.note && <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">{current.note}</p>}
            <div>
              <h3 className="mb-2 text-sm font-bold">سفارش‌های اخیر</h3>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {orders
                  .filter((o) => o.customerId === current.id)
                  .slice(0, 6)
                  .map((o) => (
                    <li key={o.id}>
                      <button onClick={() => router.push(`/orders?open=${o.id}`)} className="flex w-full items-center gap-3 p-3 text-start text-sm hover:bg-surface-2">
                        <b>{orderNo(o.number)}</b>
                        <span className="text-xs text-muted">{relative(o.createdAt)}</span>
                        <Badge tone={ORDER_STATUS[o.status].tone} className="ms-auto">{ORDER_STATUS[o.status].label}</Badge>
                        <span className="w-28 text-end font-medium">{toman(o.total)}</span>
                      </button>
                    </li>
                  ))}
                {!orders.some((o) => o.customerId === current.id) && <li className="p-6 text-center text-sm text-muted">هنوز سفارشی ثبت نکرده است.</li>}
              </ul>
            </div>
          </div>
        )}
      </Drawer>

      <CustomerForm customer={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function CustomerForm({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const exists = useStore((s) => (customer ? s.customers.some((c) => c.id === customer.id) : false));
  return customer ? <FormInner key={customer.id} customer={customer} exists={exists} onClose={onClose} /> : null;
}

function FormInner({ customer, exists, onClose }: { customer: Customer; exists: boolean; onClose: () => void }) {
  const [c, setC] = useState(customer);
  const [err, setErr] = useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    if (c.name.trim().length < 3) e.name = "نام را کامل وارد کنید";
    if (!/^(\+98|0|۰)?(9|۹)[\d۰-۹]{9}$/.test(c.phone.replace(/\s/g, ""))) e.phone = "شماره موبایل معتبر نیست";
    if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) e.email = "ایمیل معتبر نیست";
    setErr(e);
    if (Object.keys(e).length) return;
    useStore.getState().saveCustomer({ ...c, name: c.name.trim() });
    toast.success(exists ? "اطلاعات مشتری ذخیره شد" : "مشتری جدید اضافه شد");
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={exists ? "ویرایش مشتری" : "مشتری جدید"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={save}>ذخیره</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی" error={err.name} className="sm:col-span-2">
          {(id) => <Input id={id} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />}
        </Field>
        <Field label="شماره موبایل" error={err.phone}>
          {(id) => <Input id={id} inputMode="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} placeholder="۰۹۱۲۳۴۵۶۷۸۹" />}
        </Field>
        <Field label="ایمیل" error={err.email}>
          {(id) => <Input id={id} type="email" dir="ltr" className="text-end" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />}
        </Field>
        <Field label="شهر">
          {(id) => (
            <Select id={id} value={c.city} onChange={(e) => setC({ ...c, city: e.target.value })}>
              {CITIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="یادداشت (اختیاری)" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={c.note ?? ""} onChange={(e) => setC({ ...c, note: e.target.value })} className="min-h-20" />}
        </Field>
      </div>
    </Modal>
  );
}
