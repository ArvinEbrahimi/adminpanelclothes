"use client";

import { Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmDialog } from "@/components/ui/overlay";
import { Button, Card, CardHeader, Field, Input, PageHeader, Switch, Textarea } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { ACCENTS } from "@/lib/constants";
import { num, parseNum } from "@/lib/format";
import { DEFAULT_SETTINGS, useStore } from "@/lib/store";
import type { AccentKey, Settings } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const saved = useStore((s) => s.settings);
  const [s, setS] = useState<Settings>(saved);
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));

  const save = () => {
    useStore.getState().updateSettings(s);
    toast.success("تنظیمات ذخیره شد");
  };

  const reset = async () => {
    if (await confirmDialog({ title: "بازنشانی داده‌های نمونه", desc: "همه‌ی تغییرات شما (محصولات، سفارش‌ها، مشتریان و …) پاک شده و داده‌ی اولیه‌ی دمو دوباره ساخته می‌شود.", confirmText: "بازنشانی", danger: true })) {
      useStore.getState().resetDemo();
      setS(DEFAULT_SETTINGS);
      toast.success("داده‌های نمونه بازنشانی شد");
      router.push("/");
    }
  };

  return (
    <>
      <PageHeader
        title="تنظیمات"
        desc="اطلاعات فروشگاه و ترجیحات پنل"
        actions={
          <Button onClick={save} disabled={!dirty}>
            ذخیره تغییرات
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="اطلاعات فروشگاه" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="نام فروشگاه">{(id) => <Input id={id} value={s.storeName} onChange={(e) => set("storeName", e.target.value)} />}</Field>
              <Field label="تلفن پشتیبانی">{(id) => <Input id={id} value={s.phone} onChange={(e) => set("phone", e.target.value)} />}</Field>
              <Field label="ایمیل" className="sm:col-span-2">{(id) => <Input id={id} dir="ltr" className="text-end" value={s.email} onChange={(e) => set("email", e.target.value)} />}</Field>
              <Field label="نشانی" className="sm:col-span-2">{(id) => <Textarea id={id} className="min-h-20" value={s.address} onChange={(e) => set("address", e.target.value)} />}</Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="ارسال و موجودی" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="هزینه ارسال (تومان)">{(id) => <Input id={id} inputMode="numeric" value={num(s.shippingFee)} onChange={(e) => set("shippingFee", parseNum(e.target.value))} />}</Field>
              <Field label="ارسال رایگان از مبلغ">{(id) => <Input id={id} inputMode="numeric" value={num(s.freeShippingFrom)} onChange={(e) => set("freeShippingFrom", parseNum(e.target.value))} />}</Field>
              <Field label="آستانه‌ی هشدار موجودی" hint="تعداد در هر سایز">
                {(id) => <Input id={id} inputMode="numeric" value={num(s.lowStockThreshold)} onChange={(e) => set("lowStockThreshold", parseNum(e.target.value))} />}
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="اعلان‌ها و شبیه‌سازی" />
            <ul className="divide-y divide-line p-2">
              {(
                [
                  ["notifyOrders", "اعلان سفارش جدید", "با هر سفارش جدید اعلان و پیام نمایش داده شود"],
                  ["notifyStock", "هشدار کمبود موجودی", "وقتی موجودی یک سایز به آستانه برسد"],
                  ["liveOrders", "شبیه‌سازی سفارش زنده", "هر چند ثانیه یک سفارش نمونه ثبت می‌شود تا پنل «زنده» به نظر برسد"],
                ] as const
              ).map(([k, t, d]) => (
                <li key={k} className="flex items-center justify-between gap-4 p-3">
                  <div>
                    <p className="text-sm font-medium">{t}</p>
                    <p className="text-xs text-muted">{d}</p>
                  </div>
                  <Switch checked={s[k]} onChange={(v) => set(k, v)} label={t} />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="رنگ سازمانی" desc="تغییر رنگ اصلی برند در همه‌ی پنل" />
            <div className="grid grid-cols-5 gap-2 p-5">
              {(Object.entries(ACCENTS) as [AccentKey, (typeof ACCENTS)[AccentKey]][]).map(([k, a]) => (
                <button
                  key={k}
                  onClick={() => {
                    set("accent", k);
                    useStore.getState().updateSettings({ accent: k });
                  }}
                  aria-pressed={s.accent === k}
                  aria-label={a.label}
                  className={cn("group flex flex-col items-center gap-1.5 rounded-xl p-2 text-[11px] transition hover:bg-surface-2", s.accent === k && "bg-surface-2")}
                >
                  <span className="grid size-9 place-items-center rounded-full text-white ring-offset-2 ring-offset-surface" style={{ background: a.swatch, boxShadow: s.accent === k ? `0 0 0 2px ${a.swatch}` : undefined }}>
                    {s.accent === k && <Check className="size-4" />}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="داده‌های نمونه" />
            <div className="space-y-3 p-5">
              <p className="text-sm leading-7 text-muted">این نسخه بدون سرور کار می‌کند و همه‌چیز در مرورگر شما ذخیره می‌شود. برای شروع دوباره می‌توانید داده‌ها را بازنشانی کنید.</p>
              <Button variant="outline" className="w-full text-danger" onClick={reset}>
                <RotateCcw /> بازنشانی داده‌ها
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
