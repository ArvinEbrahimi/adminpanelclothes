"use client";

import { ArrowRight, Check, Copy, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductThumb } from "@/components/product-thumb";
import { confirmDialog } from "@/components/ui/overlay";
import { Badge, Button, Card, CardHeader, Empty, Field, Input, PageHeader, Select, Switch, Textarea } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { CATEGORIES, PRODUCT_STATUS, sizeLabel, sizesFor } from "@/lib/constants";
import { num, parseNum, pct, toman } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Category, ColorOption, Product, ProductStatus } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const PALETTE: ColorOption[] = [
  { name: "مشکی", hex: "#1c1b18" },
  { name: "سفید", hex: "#f5f3ee" },
  { name: "سرمه‌ای", hex: "#1e2a4a" },
  { name: "زیتونی", hex: "#5b6b3a" },
  { name: "کرم", hex: "#e4d5b7" },
  { name: "طوسی", hex: "#8b8f94" },
  { name: "قرمز آجری", hex: "#a8402c" },
  { name: "سبز یشمی", hex: "#2f7d6a" },
  { name: "صورتی پودری", hex: "#e8b8b8" },
  { name: "قهوه‌ای", hex: "#6b4a32" },
  { name: "آبی یخی", hex: "#a9c7dc" },
  { name: "خردلی", hex: "#c99a2e" },
];

const blank = (): Product => ({
  id: "p" + uid(),
  name: "",
  sku: `PSH-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
  category: "shirt",
  description: "",
  price: 0,
  cost: 0,
  colors: [PALETTE[0]],
  stock: Object.fromEntries(sizesFor("shirt").map((s) => [s, 0])),
  status: "draft",
  featured: false,
  rating: 0,
  createdAt: Date.now(),
});

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const existing = useStore((s) => s.products.find((p) => p.id === id));
  if (id !== "new" && !existing) {
    return (
      <Card>
        <Empty icon={<ArrowRight />} title="محصول پیدا نشد" desc="ممکن است حذف شده باشد." action={<Link href="/products"><Button>بازگشت به محصولات</Button></Link>} />
      </Card>
    );
  }
  return <Editor key={id} initial={existing ?? blank()} isNew={id === "new"} />;
}

function Editor({ initial, isNew }: { initial: Product; isNew: boolean }) {
  const router = useRouter();
  const [p, setP] = useState<Product>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };

  const sizes = sizesFor(p.category);
  const margin = useMemo(() => {
    const eff = p.salePrice || p.price;
    return eff > 0 ? { profit: eff - p.cost, pct: ((eff - p.cost) / eff) * 100 } : null;
  }, [p.price, p.salePrice, p.cost]);
  const total = Object.values(p.stock).reduce((s, n) => s + (n ?? 0), 0);

  const changeCategory = (c: Category) => {
    const next = sizesFor(c);
    setP((x) => ({ ...x, category: c, stock: Object.fromEntries(next.map((s) => [s, x.stock[s] ?? 0])) }));
    setDirty(true);
  };

  const toggleColor = (c: ColorOption) => {
    const has = p.colors.some((x) => x.hex === c.hex);
    if (has && p.colors.length === 1) return;
    set("colors", has ? p.colors.filter((x) => x.hex !== c.hex) : [...p.colors, c]);
  };

  const save = (status?: ProductStatus) => {
    const e: Record<string, string> = {};
    if (p.name.trim().length < 3) e.name = "نام محصول حداقل ۳ حرف باشد";
    if (p.price <= 0) e.price = "قیمت را وارد کنید";
    if (p.salePrice && p.salePrice >= p.price) e.salePrice = "قیمت ویژه باید کمتر از قیمت اصلی باشد";
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("لطفاً خطاهای فرم را برطرف کنید");
      return;
    }
    useStore.getState().saveProduct({ ...p, name: p.name.trim(), status: status ?? p.status });
    setDirty(false);
    toast.success(isNew ? "محصول جدید ساخته شد" : "تغییرات ذخیره شد");
    router.push("/products");
  };

  const remove = async () => {
    if (await confirmDialog({ title: "حذف محصول", desc: `«${p.name}» برای همیشه حذف می‌شود.`, confirmText: "حذف", danger: true })) {
      useStore.getState().deleteProducts([p.id]);
      toast.success("محصول حذف شد");
      router.push("/products");
    }
  };

  const duplicate = () => {
    const copy = { ...p, id: "p" + uid(), name: `${p.name} (کپی)`, sku: `${p.sku}-C`, status: "draft" as const, createdAt: Date.now() };
    useStore.getState().saveProduct(copy);
    toast.success("نسخه‌ی کپی ساخته شد");
    router.push(`/products/${copy.id}`);
  };

  const back = async () => {
    if (!dirty || (await confirmDialog({ title: "خروج بدون ذخیره؟", desc: "تغییرات ذخیره‌نشده از بین می‌رود.", confirmText: "خروج" }))) router.push("/products");
  };

  return (
    <>
      <button onClick={back} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> محصولات
      </button>
      <PageHeader
        title={isNew ? "محصول جدید" : p.name || "ویرایش محصول"}
        desc={isNew ? "اطلاعات محصول را وارد کنید" : `کد محصول: ${p.sku}`}
        actions={
          <>
            {!isNew && (
              <>
                <Button variant="outline" onClick={duplicate}>
                  <Copy /> کپی
                </Button>
                <Button variant="outline" className="text-danger" onClick={remove}>
                  <Trash2 /> حذف
                </Button>
              </>
            )}
            <Button onClick={() => save()}>
              <Save /> ذخیره
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="اطلاعات پایه" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="نام محصول" error={errors.name} className="sm:col-span-2">
                {(id) => <Input id={id} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="مثلاً: پیراهن کتان آکسفورد" aria-invalid={!!errors.name} />}
              </Field>
              <Field label="دسته‌بندی">
                {(id) => (
                  <Select id={id} value={p.category} onChange={(e) => changeCategory(e.target.value as Category)}>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="کد محصول (SKU)">{(id) => <Input id={id} value={p.sku} onChange={(e) => set("sku", e.target.value)} dir="ltr" className="text-end" />}</Field>
              <Field label="توضیحات" className="sm:col-span-2" hint={`${num(p.description.length)} / ${num(500)} حرف`}>
                {(id) => <Textarea id={id} value={p.description} maxLength={500} onChange={(e) => set("description", e.target.value)} placeholder="جنس، برش، نکات شست‌وشو…" />}
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="قیمت‌گذاری" desc="ورودی به تومان است" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="قیمت اصلی" error={errors.price}>
                {(id) => <Input id={id} inputMode="numeric" value={p.price ? num(p.price) : ""} onChange={(e) => set("price", parseNum(e.target.value))} placeholder="۰" />}
              </Field>
              <Field label="قیمت ویژه (اختیاری)" error={errors.salePrice}>
                {(id) => <Input id={id} inputMode="numeric" value={p.salePrice ? num(p.salePrice) : ""} onChange={(e) => set("salePrice", parseNum(e.target.value) || undefined)} placeholder="۰" />}
              </Field>
              <Field label="قیمت تمام‌شده">
                {(id) => <Input id={id} inputMode="numeric" value={p.cost ? num(p.cost) : ""} onChange={(e) => set("cost", parseNum(e.target.value))} placeholder="۰" />}
              </Field>
            </div>
            {margin && (
              <div className="mx-5 mb-5 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl bg-surface-2 px-4 py-3 text-sm">
                <span>
                  سود هر واحد: <b className={margin.profit >= 0 ? "text-success" : "text-danger"}>{toman(margin.profit)}</b>
                </span>
                <span>
                  حاشیه‌ی سود: <b className={margin.pct >= 25 ? "text-success" : margin.pct >= 0 ? "text-warn" : "text-danger"}>{pct(margin.pct)}</b>
                </span>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="رنگ‌ها و موجودی" desc={`مجموع موجودی: ${num(total)} عدد`} />
            <div className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-[13px] font-medium">رنگ‌های موجود</p>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((c) => {
                    const on = p.colors.some((x) => x.hex === c.hex);
                    return (
                      <button key={c.hex} onClick={() => toggleColor(c)} aria-pressed={on} title={c.name} className={cn("relative grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-surface transition", on ? "ring-2 ring-brand" : "ring-1 ring-line hover:scale-110")} style={{ background: c.hex }}>
                        {on && <Check className="size-4" style={{ color: c.hex === "#f5f3ee" || c.hex === "#e4d5b7" || c.hex === "#e8b8b8" || c.hex === "#a9c7dc" ? "#000" : "#fff" }} />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted">{p.colors.map((c) => c.name).join("، ")}</p>
              </div>
              <div>
                <p className="mb-2 text-[13px] font-medium">موجودی هر سایز</p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {sizes.map((s) => (
                    <label key={s} className="block rounded-xl border border-line p-2.5 text-center focus-within:border-brand">
                      <span className="mb-1 block text-xs font-bold text-muted">{sizeLabel(s)}</span>
                      <input
                        inputMode="numeric"
                        aria-label={`موجودی سایز ${sizeLabel(s)}`}
                        value={num(p.stock[s] ?? 0)}
                        onChange={(e) => set("stock", { ...p.stock, [s]: parseNum(e.target.value) })}
                        className="w-full bg-transparent text-center text-lg font-bold outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <ProductThumb category={p.category} color={p.colors[0]?.hex} size="fill" className="h-56 w-full !rounded-none" />
            <div className="space-y-1 p-4">
              <p className="truncate font-bold">{p.name || "نام محصول"}</p>
              <p className="text-sm text-muted">{CATEGORIES[p.category]}</p>
              <div className="flex items-baseline gap-2 pt-1">
                <b>{toman(p.salePrice || p.price)}</b>
                {p.salePrice ? <s className="text-xs text-muted">{num(p.price)}</s> : null}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="انتشار" />
            <div className="space-y-4 p-5">
              <Field label="وضعیت">
                {(id) => (
                  <Select id={id} value={p.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
                    {Object.entries(PRODUCT_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">محصول ویژه</p>
                  <p className="text-xs text-muted">نمایش در صفحه‌ی اصلی فروشگاه</p>
                </div>
                <Switch checked={p.featured} onChange={(v) => set("featured", v)} label="محصول ویژه" />
              </div>
              {!isNew && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">امتیاز مشتریان</span>
                  <Badge tone="warn">★ {num(p.rating)}</Badge>
                </div>
              )}
              {isNew && (
                <Button variant="outline" className="w-full" onClick={() => save("active")}>
                  ذخیره و انتشار
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
