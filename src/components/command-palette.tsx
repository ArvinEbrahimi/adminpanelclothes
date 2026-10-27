"use client";

import { BarChart3, Boxes, CornerDownLeft, LayoutDashboard, Moon, Package, Plus, Search, Settings, ShoppingBag, Tag, User, Users, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { orderNo, toman } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ORDER_STATUS } from "@/lib/constants";
import { Modal } from "./ui/overlay";

interface Item {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: LucideIcon;
  run: () => void;
}

type PaletteProps = { open: boolean; onClose: () => void; onToggleTheme: () => void };

/** Mount only while open so query + selection reset naturally. */
export function CommandPalette(props: PaletteProps) {
  return props.open ? <Palette {...props} /> : null;
}

function Palette({ open, onClose, onToggleTheme }: PaletteProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const products = useStore((s) => s.products);
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const listRef = useRef<HTMLUListElement>(null);

  const go = (href: string) => () => {
    onClose();
    router.push(href);
  };

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = [
      { id: "n-dash", label: "داشبورد", group: "صفحات", icon: LayoutDashboard, run: go("/") },
      { id: "n-orders", label: "سفارش‌ها", group: "صفحات", icon: ShoppingBag, run: go("/orders") },
      { id: "n-products", label: "محصولات", group: "صفحات", icon: Package, run: go("/products") },
      { id: "n-inv", label: "انبار و موجودی", group: "صفحات", icon: Boxes, run: go("/inventory") },
      { id: "n-cust", label: "مشتریان", group: "صفحات", icon: Users, run: go("/customers") },
      { id: "n-coupons", label: "کد تخفیف", group: "صفحات", icon: Tag, run: go("/coupons") },
      { id: "n-reports", label: "گزارش‌ها", group: "صفحات", icon: BarChart3, run: go("/reports") },
      { id: "n-settings", label: "تنظیمات", group: "صفحات", icon: Settings, run: go("/settings") },
      { id: "a-new", label: "افزودن محصول جدید", group: "اقدام سریع", icon: Plus, run: go("/products/new") },
      {
        id: "a-theme",
        label: "تغییر تم روشن/تیره",
        group: "اقدام سریع",
        icon: Moon,
        run: () => {
          onToggleTheme();
          onClose();
        },
      },
    ];
    const term = q.trim().toLowerCase();
    if (!term) return nav;
    const m = (s: string) => s.toLowerCase().includes(term);
    const found: Item[] = [
      ...nav.filter((n) => m(n.label)),
      ...products.filter((p) => m(p.name) || m(p.sku)).slice(0, 5).map((p) => ({ id: p.id, label: p.name, hint: p.sku, group: "محصولات", icon: Package, run: go(`/products/${p.id}`) })),
      ...orders.filter((o) => m(String(o.number)) || m(String(o.number).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]))).slice(0, 4).map((o) => ({ id: o.id, label: `سفارش ${orderNo(o.number)}`, hint: `${ORDER_STATUS[o.status].label} · ${toman(o.total)}`, group: "سفارش‌ها", icon: ShoppingBag, run: go(`/orders?open=${o.id}`) })),
      ...customers.filter((c) => m(c.name) || m(c.phone)).slice(0, 4).map((c) => ({ id: c.id, label: c.name, hint: c.city, group: "مشتریان", icon: User, run: go(`/customers?open=${c.id}`) })),
    ];
    return found;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, products, orders, customers]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[idx]?.run();
    }
  };

  let last = "";
  return (
    <Modal open={open} onClose={onClose} title="جستجوی سراسری" width="max-w-xl">
      <div onKeyDown={onKey} className="-m-5">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <Search className="size-5 text-muted" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} placeholder="نام محصول، شماره سفارش، نام مشتری…" className="h-9 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
        </div>
        <ul ref={listRef} className="max-h-[50dvh] overflow-y-auto p-2">
          {items.length === 0 && <li className="py-10 text-center text-sm text-muted">نتیجه‌ای پیدا نشد</li>}
          {items.map((it, i) => {
            const header = it.group !== last ? (last = it.group) : null;
            return (
              <li key={it.id}>
                {header && <p className="px-3 pb-1 pt-3 text-[11px] font-medium text-muted">{header}</p>}
                <button data-i={i} onMouseMove={() => setIdx(i)} onClick={it.run} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm", i === idx ? "bg-brand-soft text-brand-ink" : "")}>
                  <it.icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate font-medium">{it.label}</span>
                  {it.hint && <span className="truncate text-xs text-muted">{it.hint}</span>}
                  {i === idx && <CornerDownLeft className="size-3.5 shrink-0 opacity-60" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
