"use client";

import { AlertTriangle, Boxes, Minus, PackageX, Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductThumb } from "@/components/product-thumb";
import { StatCard } from "@/components/stat-card";
import { Badge, Card, Empty, PageHeader, SearchInput, Tabs } from "@/components/ui/primitives";
import { CATEGORIES, sizeLabel, sizesFor } from "@/lib/constants";
import { num, parseNum, toman } from "@/lib/format";
import { totalStock, useStore } from "@/lib/store";
import type { Product, Size } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "low" | "out";

export default function InventoryPage() {
  const products = useStore((s) => s.products);
  const threshold = useStore((s) => s.settings.lowStockThreshold);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const isLow = (p: Product) => sizesFor(p.category).some((s) => (p.stock[s] ?? 0) <= threshold);
  const stats = useMemo(() => {
    let units = 0, value = 0, low = 0, out = 0;
    products.forEach((p) => {
      const t = totalStock(p);
      units += t;
      value += t * p.cost;
      if (t === 0) out++;
      else if (p.status === "active" && isLow(p)) low++;
    });
    return { units, value, low, out };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, threshold]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products
      .filter((p) => p.status !== "archived")
      .filter((p) => (filter === "all" ? true : filter === "out" ? totalStock(p) === 0 : isLow(p) && totalStock(p) > 0))
      .filter((p) => !t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t))
      .sort((a, b) => totalStock(a) - totalStock(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, q, filter, threshold]);

  return (
    <>
      <PageHeader title="انبار و موجودی" desc="موجودی هر سایز را مستقیماً ویرایش کنید؛ تغییرات بلافاصله ذخیره می‌شود." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="کل موجودی" value={`${num(stats.units)} عدد`} icon={<Boxes />} hint="در همه‌ی محصولات" />
        <StatCard label="ارزش انبار" value={toman(stats.value)} icon={<Wallet />} hint="بر اساس قیمت تمام‌شده" />
        <StatCard label="رو به اتمام" value={num(stats.low)} icon={<AlertTriangle />} hint="محصول با سایز کم‌موجود" />
        <StatCard label="ناموجود" value={num(stats.out)} icon={<PackageX />} hint="محصول بدون موجودی" />
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              { value: "all", label: "همه" },
              { value: "low", label: "رو به اتمام", count: stats.low },
              { value: "out", label: "ناموجود", count: stats.out },
            ]}
          />
          <div className="min-w-48 flex-1 sm:max-w-xs">
            <SearchInput placeholder="جستجوی محصول…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجو" />
          </div>
        </div>
        {rows.length === 0 ? (
          <Empty icon={<Boxes />} title="موردی پیدا نشد" desc="همه‌ی محصولات این فیلتر موجودی کافی دارند." />
        ) : (
          <ul className="divide-y divide-line">
            {rows.slice(0, 40).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                <div className="flex w-full min-w-0 items-center gap-3 md:w-72">
                  <ProductThumb category={p.category} color={p.colors[0]?.hex} size={46} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{CATEGORIES[p.category]} · مجموع {num(totalStock(p))}</p>
                  </div>
                  {totalStock(p) === 0 && <Badge tone="danger">ناموجود</Badge>}
                </div>
                <div className="flex flex-1 flex-wrap gap-2">
                  {sizesFor(p.category).map((s) => (
                    <Stepper key={s} product={p} size={s} threshold={threshold} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Stepper({ product, size, threshold }: { product: Product; size: Size; threshold: number }) {
  const qty = product.stock[size] ?? 0;
  const { setStock } = useStore.getState();
  const tone = qty === 0 ? "border-danger/40 bg-danger-soft/60" : qty <= threshold ? "border-warn/40 bg-warn-soft/60" : "border-line";
  return (
    <div className={cn("flex items-center rounded-xl border", tone)}>
      <button onClick={() => setStock(product.id, size, qty + 1)} className="grid size-8 place-items-center text-muted hover:text-fg" aria-label={`افزایش سایز ${sizeLabel(size)}`}>
        <Plus className="size-3.5" />
      </button>
      <label className="flex min-w-10 flex-col items-center px-0.5 leading-none">
        <span className="text-[10px] text-muted">{sizeLabel(size)}</span>
        <input
          inputMode="numeric"
          value={num(qty)}
          onChange={(e) => setStock(product.id, size, parseNum(e.target.value))}
          aria-label={`موجودی سایز ${sizeLabel(size)}`}
          className="mt-0.5 w-9 bg-transparent text-center text-sm font-bold outline-none"
        />
      </label>
      <button onClick={() => setStock(product.id, size, qty - 1)} disabled={qty === 0} className="grid size-8 place-items-center text-muted hover:text-fg disabled:opacity-30" aria-label={`کاهش سایز ${sizeLabel(size)}`}>
        <Minus className="size-3.5" />
      </button>
    </div>
  );
}
