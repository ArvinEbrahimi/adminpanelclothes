"use client";

import { Archive, Download, LayoutGrid, List, Package, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductThumb } from "@/components/product-thumb";
import { DataTable } from "@/components/ui/data-table";
import { confirmDialog } from "@/components/ui/overlay";
import { Badge, Button, Card, Empty, PageHeader, Select, SearchInput, Tabs } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { CATEGORIES, PRODUCT_STATUS } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { num, toman } from "@/lib/format";
import { totalStock, useStore } from "@/lib/store";
import type { Category, Product, ProductStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "table" | "grid";

export default function ProductsPage() {
  const router = useRouter();
  const products = useStore((s) => s.products);
  const threshold = useStore((s) => s.settings.lowStockThreshold);
  const { deleteProducts, setProductStatus } = useStore.getState();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [view, setView] = useState<View>("table");
  const [selected, setSelected] = useState<string[]>([]);

  const counts = useMemo(() => {
    const c = { all: products.length, active: 0, draft: 0, archived: 0 };
    products.forEach((p) => c[p.status]++);
    return c;
  }, [products]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => (cat === "all" || p.category === cat) && (status === "all" || p.status === status) && (!t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t)));
  }, [products, q, cat, status]);

  const remove = async (ids: string[]) => {
    if (await confirmDialog({ title: "حذف محصول", desc: `آیا از حذف ${num(ids.length)} محصول مطمئن هستید؟ این عمل قابل بازگشت نیست.`, confirmText: "حذف", danger: true })) {
      deleteProducts(ids);
      setSelected([]);
      toast.success("محصول حذف شد");
    }
  };

  const stockBadge = (p: Product) => {
    const t = totalStock(p);
    return t === 0 ? <Badge tone="danger">ناموجود</Badge> : t <= threshold * 2 ? <Badge tone="warn">{num(t)} عدد · کم</Badge> : <span className="text-sm">{num(t)} عدد</span>;
  };

  return (
    <>
      <PageHeader
        title="محصولات"
        desc={`${num(products.length)} محصول در کاتالوگ`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv("products.csv", ["نام", "کد", "دسته", "قیمت", "قیمت ویژه", "موجودی", "وضعیت"], rows.map((p) => [p.name, p.sku, CATEGORIES[p.category], p.price, p.salePrice ?? "", totalStock(p), PRODUCT_STATUS[p.status].label]));
                toast.success("فایل CSV دانلود شد");
              }}
            >
              <Download /> خروجی CSV
            </Button>
            <Link href="/products/new">
              <Button>
                <Plus /> محصول جدید
              </Button>
            </Link>
          </>
        }
      />

      <Card>
        <div className="space-y-3 border-b border-line p-4">
          <Tabs
            value={status}
            onChange={(v) => setStatus(v)}
            items={[
              { value: "all", label: "همه", count: counts.all },
              { value: "active", label: "فعال", count: counts.active },
              { value: "draft", label: "پیش‌نویس", count: counts.draft },
              { value: "archived", label: "بایگانی", count: counts.archived },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <div className="min-w-48 flex-1 sm:max-w-xs">
              <SearchInput placeholder="جستجوی نام یا کد محصول…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجو" />
            </div>
            <Select value={cat} onChange={(e) => setCat(e.target.value as Category | "all")} className="w-auto min-w-40" aria-label="دسته‌بندی">
              <option value="all">همه‌ی دسته‌ها</option>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <div className="ms-auto inline-flex rounded-xl bg-surface-2 p-1" role="group" aria-label="نوع نمایش">
              {([["table", List, "جدول"], ["grid", LayoutGrid, "شبکه"]] as const).map(([v, Icon, label]) => (
                <button key={v} onClick={() => setView(v)} aria-label={label} aria-pressed={view === v} className={cn("grid size-8 place-items-center rounded-lg", view === v ? "bg-surface shadow-sm" : "text-muted")}>
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-ink">
              <b>{num(selected.length)} مورد انتخاب شده</b>
              <span className="ms-auto flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => { setProductStatus(selected, "archived"); setSelected([]); toast.success("محصولات بایگانی شدند"); }}>
                  <Archive /> بایگانی
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(selected)}>
                  <Trash2 /> حذف
                </Button>
              </span>
            </div>
          )}
        </div>

        {view === "table" ? (
          <DataTable
            rows={rows}
            rowKey={(p) => p.id}
            selectable
            selected={selected}
            onSelect={setSelected}
            onRowClick={(p) => router.push(`/products/${p.id}`)}
            defaultSort={undefined}
            empty={<Empty icon={<Package />} title="محصولی پیدا نشد" desc="فیلترها را تغییر دهید یا محصول جدیدی اضافه کنید." />}
            columns={[
              {
                key: "name",
                header: "محصول",
                sort: (p) => p.name,
                cell: (p) => (
                  <div className="flex items-center gap-3">
                    <ProductThumb category={p.category} color={p.colors[0]?.hex} size={44} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-medium">
                        {p.name}
                        {p.featured && <Star className="size-3.5 shrink-0 fill-warn text-warn" aria-label="ویژه" />}
                      </p>
                      <p className="text-xs text-muted" dir="ltr">{p.sku}</p>
                    </div>
                  </div>
                ),
              },
              { key: "cat", header: "دسته", hideBelow: "md", sort: (p) => CATEGORIES[p.category], cell: (p) => <span className="text-muted">{CATEGORIES[p.category]}</span> },
              {
                key: "price",
                header: "قیمت",
                sort: (p) => p.salePrice ?? p.price,
                cell: (p) => (
                  <div className="whitespace-nowrap">
                    <p className="font-bold">{toman(p.salePrice ?? p.price)}</p>
                    {p.salePrice && <p className="text-xs text-muted line-through">{num(p.price)}</p>}
                  </div>
                ),
              },
              { key: "stock", header: "موجودی", hideBelow: "sm", sort: (p) => totalStock(p), cell: stockBadge },
              {
                key: "colors",
                header: "رنگ‌ها",
                hideBelow: "lg",
                cell: (p) => (
                  <div className="flex -space-x-1.5 space-x-reverse">
                    {p.colors.map((c) => (
                      <i key={c.name} title={c.name} className="size-5 rounded-full ring-2 ring-surface" style={{ background: c.hex }} />
                    ))}
                  </div>
                ),
              },
              { key: "status", header: "وضعیت", sort: (p) => p.status, cell: (p) => <Badge tone={PRODUCT_STATUS[p.status].tone} dot>{PRODUCT_STATUS[p.status].label}</Badge> },
            ]}
          />
        ) : rows.length === 0 ? (
          <Empty icon={<Package />} title="محصولی پیدا نشد" desc="فیلترها را تغییر دهید یا محصول جدیدی اضافه کنید." />
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.slice(0, 48).map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group overflow-hidden rounded-2xl border border-line transition hover:-translate-y-0.5 hover:shadow-card">
                <ProductThumb category={p.category} color={p.colors[0]?.hex} size="fill" className="h-40 w-full !rounded-none" />
                <div className="space-y-1.5 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-bold">{p.name}</p>
                    <Badge tone={PRODUCT_STATUS[p.status].tone}>{PRODUCT_STATUS[p.status].label}</Badge>
                  </div>
                  <p className="text-xs text-muted">{CATEGORIES[p.category]}</p>
                  <div className="flex items-center justify-between pt-1">
                    <b className="text-sm">{toman(p.salePrice ?? p.price)}</b>
                    <span className="text-xs text-muted">{num(totalStock(p))} عدد</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
