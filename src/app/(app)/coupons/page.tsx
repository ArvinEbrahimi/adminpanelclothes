"use client";

import { Copy, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { confirmDialog, Modal } from "@/components/ui/overlay";
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Progress, Select, Switch } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { DAY, date, num, parseNum, toman } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Coupon } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const blank = (): Coupon => ({ id: "k" + uid(), code: "", type: "percent", value: 10, minOrder: 0, usageLimit: 100, used: 0, expiresAt: Date.now() + 30 * DAY, active: true });

export default function CouponsPage() {
  const coupons = useStore((s) => s.coupons);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [now] = useState(Date.now);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast.success(`کد ${code} کپی شد`);
  };
  const remove = async (c: Coupon) => {
    if (await confirmDialog({ title: "حذف کد تخفیف", desc: `کد ${c.code} حذف می‌شود.`, confirmText: "حذف", danger: true })) {
      useStore.getState().deleteCoupon(c.id);
      toast.success("کد تخفیف حذف شد");
    }
  };

  return (
    <>
      <PageHeader
        title="کد تخفیف"
        desc={`${num(coupons.filter((c) => c.active && c.expiresAt > now).length)} کد فعال`}
        actions={
          <Button onClick={() => setEditing(blank())}>
            <Plus /> کد جدید
          </Button>
        }
      />
      {coupons.length === 0 ? (
        <Card>
          <Empty icon={<Tag />} title="هنوز کد تخفیفی نساخته‌اید" action={<Button onClick={() => setEditing(blank())}>ساخت اولین کد</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const expired = c.expiresAt < now;
            const full = c.used >= c.usageLimit;
            const dead = expired || full;
            const usage = (c.used / c.usageLimit) * 100;
            const daysLeft = Math.ceil((c.expiresAt - now) / DAY);
            return (
              <Card key={c.id} className={cn("overflow-hidden", dead && "opacity-70")}>
                <div className="flex items-center justify-between gap-3 bg-brand-soft px-5 py-4">
                  <div>
                    <p className="text-3xl font-black text-brand-ink">{c.type === "percent" ? `${num(c.value)}٪` : toman(c.value)}</p>
                    <p className="text-xs text-brand-ink/80">{c.type === "percent" ? "تخفیف درصدی" : "تخفیف ثابت"}</p>
                  </div>
                  <Switch checked={c.active && !dead} onChange={() => useStore.getState().toggleCoupon(c.id)} label={`فعال‌سازی ${c.code}`} />
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => copy(c.code)} className="group flex items-center gap-2 rounded-lg border border-dashed border-muted/50 px-3 py-1.5 font-mono text-sm font-bold tracking-wider hover:border-brand" dir="ltr" aria-label={`کپی کد ${c.code}`}>
                      {c.code}
                      <Copy className="size-3.5 text-muted group-hover:text-brand" />
                    </button>
                    {expired ? <Badge tone="danger">منقضی‌شده</Badge> : full ? <Badge tone="warn">ظرفیت تکمیل</Badge> : daysLeft <= 10 ? <Badge tone="warn">{num(daysLeft)} روز مانده</Badge> : <Badge tone="success">فعال</Badge>}
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-muted">
                      <span>استفاده‌شده</span>
                      <span>
                        {num(c.used)} از {num(c.usageLimit)}
                      </span>
                    </div>
                    <Progress value={usage} tone={usage >= 90 ? "danger" : usage >= 70 ? "warn" : "brand"} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-muted">حداقل سفارش</dt>
                      <dd className="mt-0.5 font-medium">{c.minOrder ? toman(c.minOrder) : "بدون محدودیت"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">انقضا</dt>
                      <dd className="mt-0.5 font-medium">{date(c.expiresAt)}</dd>
                    </div>
                  </dl>
                  <div className="flex gap-2 border-t border-line pt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(c)}>
                      <Pencil /> ویرایش
                    </Button>
                    <Button variant="outline" size="sm" className="text-danger" onClick={() => remove(c)} aria-label="حذف">
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {editing && <CouponForm key={editing.id} coupon={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function CouponForm({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const exists = useStore((s) => s.coupons.some((c) => c.id === coupon.id));
  const others = useStore((s) => s.coupons);
  const [c, setC] = useState(coupon);
  const [err, setErr] = useState<Record<string, string>>({});
  const [created] = useState(Date.now);
  const days = Math.max(1, Math.round((c.expiresAt - created) / DAY));

  const save = () => {
    const e: Record<string, string> = {};
    const code = c.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,16}$/.test(code)) e.code = "کد باید ۳ تا ۱۶ حرف یا عدد انگلیسی باشد";
    else if (others.some((o) => o.code === code && o.id !== c.id)) e.code = "این کد قبلاً ساخته شده است";
    if (c.value <= 0 || (c.type === "percent" && c.value > 100)) e.value = c.type === "percent" ? "درصد بین ۱ تا ۱۰۰ باشد" : "مبلغ را وارد کنید";
    if (c.usageLimit <= 0) e.limit = "ظرفیت را وارد کنید";
    setErr(e);
    if (Object.keys(e).length) return;
    useStore.getState().saveCoupon({ ...c, code });
    toast.success(exists ? "کد تخفیف ذخیره شد" : "کد تخفیف ساخته شد");
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={exists ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}
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
        <Field label="کد" error={err.code} className="sm:col-span-2">
          {(id) => <Input id={id} dir="ltr" className="text-end font-mono uppercase tracking-wider" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} placeholder="SUMMER20" />}
        </Field>
        <Field label="نوع تخفیف">
          {(id) => (
            <Select id={id} value={c.type} onChange={(e) => setC({ ...c, type: e.target.value as Coupon["type"], value: e.target.value === "percent" ? 10 : 50000 })}>
              <option value="percent">درصدی</option>
              <option value="fixed">مبلغ ثابت (تومان)</option>
            </Select>
          )}
        </Field>
        <Field label={c.type === "percent" ? "درصد تخفیف" : "مبلغ تخفیف"} error={err.value}>
          {(id) => <Input id={id} inputMode="numeric" value={num(c.value)} onChange={(e) => setC({ ...c, value: parseNum(e.target.value) })} />}
        </Field>
        <Field label="حداقل مبلغ سفارش">
          {(id) => <Input id={id} inputMode="numeric" value={num(c.minOrder)} onChange={(e) => setC({ ...c, minOrder: parseNum(e.target.value) })} />}
        </Field>
        <Field label="تعداد دفعات مجاز" error={err.limit}>
          {(id) => <Input id={id} inputMode="numeric" value={num(c.usageLimit)} onChange={(e) => setC({ ...c, usageLimit: parseNum(e.target.value) })} />}
        </Field>
        <Field label="اعتبار (روز از امروز)" className="sm:col-span-2" hint={`انقضا: ${date(c.expiresAt)}`}>
          {(id) => <Input id={id} inputMode="numeric" value={num(days)} onChange={(e) => setC({ ...c, expiresAt: Date.now() + Math.max(1, parseNum(e.target.value)) * DAY })} />}
        </Field>
      </div>
    </Modal>
  );
}
