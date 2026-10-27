"use client";

import { BarChart3, Bell, Boxes, CheckCheck, Command, LayoutDashboard, LogOut, Menu, Moon, Package, Search, Settings, ShoppingBag, Sun, Tag, Users, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { relative } from "@/lib/format";
import { totalStock, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { ToastHost, toast } from "./ui/toast";
import { ConfirmHost } from "./ui/overlay";
import { Popover } from "./ui/popover";
import { Avatar, Button, Skeleton } from "./ui/primitives";

const NAV: { href: string; label: string; icon: LucideIcon; group: string }[] = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard, group: "مرور کلی" },
  { href: "/orders", label: "سفارش‌ها", icon: ShoppingBag, group: "فروش" },
  { href: "/products", label: "محصولات", icon: Package, group: "فروش" },
  { href: "/inventory", label: "انبار و موجودی", icon: Boxes, group: "فروش" },
  { href: "/customers", label: "مشتریان", icon: Users, group: "مشتریان و بازاریابی" },
  { href: "/coupons", label: "کد تخفیف", icon: Tag, group: "مشتریان و بازاریابی" },
  { href: "/reports", label: "گزارش‌ها", icon: BarChart3, group: "تحلیل" },
  { href: "/settings", label: "تنظیمات", icon: Settings, group: "تحلیل" },
];

/* ---- theme (stored separately so it applies before hydration of the main store) ---- */
function useTheme() {
  const dark = useSyncExternalStore(
    (cb) => {
      const mo = new MutationObserver(cb);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => mo.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("pooshin-ui", JSON.stringify({ theme: next ? "dark" : "light" }));
    } catch {}
  }, []);
  return { dark, toggle };
}

export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const authed = useStore((s) => s.authed);
  const accent = useStore((s) => s.settings.accent);
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const theme = useTheme();

  // hydrate persisted state once
  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => useStore.getState().init());
  }, []);

  useEffect(() => {
    if (hydrated && !authed) router.replace("/login");
  }, [hydrated, authed, router]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  // global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // live order simulation — makes the demo feel connected to a real backend
  const live = useStore((s) => s.settings.liveOrders);
  useEffect(() => {
    if (!hydrated || !authed || !live) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        if (document.visibilityState === "visible") useStore.getState().simulateOrder();
        schedule();
      }, 35000 + Math.random() * 25000);
    };
    schedule();
    return () => clearTimeout(t);
  }, [hydrated, authed, live]);

  if (!hydrated || !authed) return <ShellSkeleton />;

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-fg">
        پرش به محتوای اصلی
      </a>
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-line bg-surface lg:flex">
        <Sidebar path={path} />
      </aside>
      {/* mobile sidebar */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-[fade-in_.2s] bg-black/50" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] animate-[slide-in_.22s_ease-out] flex-col bg-surface shadow-2xl">
            <Sidebar path={path} onClose={() => setNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:ps-64">
        <Topbar onMenu={() => setNavOpen(true)} onSearch={() => setPaletteOpen(true)} theme={theme} />
        <main id="main" className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div key={path} className="page-enter">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onToggleTheme={theme.toggle} />
      <ToastHost />
      <ConfirmHost />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 start-0 hidden w-64 border-e border-line bg-surface p-5 lg:block">
        <Skeleton className="h-10 w-36" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </aside>
      <div className="p-6 lg:ps-72">
        <Skeleton className="mb-6 h-14" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <Skeleton className="mt-4 h-80" />
      </div>
    </div>
  );
}

function Sidebar({ path, onClose }: { path: string; onClose?: () => void }) {
  const lowCount = useStore((s) => s.products.filter((p) => p.status === "active" && totalStock(p) <= s.settings.lowStockThreshold * 2).length);
  const pending = useStore((s) => s.orders.filter((o) => o.status === "paid" || o.status === "pending").length);
  const badges: Record<string, number> = { "/inventory": lowCount, "/orders": pending };
  const groups = [...new Set(NAV.map((n) => n.group))];
  const storeName = useStore((s) => s.settings.storeName);
  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-lg font-black text-brand-fg">پ</span>
          <span className="leading-tight">
            <span className="block text-[17px] font-extrabold">{storeName}</span>
            <span className="block text-[11px] text-muted">پنل مدیریت فروشگاه</span>
          </span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="بستن منو">
            <X />
          </Button>
        )}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="منوی اصلی">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-1.5 px-3 text-[11px] font-medium text-muted">{g}</p>
            <ul className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
                const badge = badges[n.href];
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-surface-2 hover:text-fg")}
                    >
                      <n.icon className="size-[18px]" />
                      <span className="flex-1">{n.label}</span>
                      {badge ? <span className={cn("rounded-full px-1.5 text-[11px] font-bold", active ? "bg-brand text-brand-fg" : "bg-surface-2 text-muted")}>{badge.toLocaleString("fa-IR")}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-brand-soft p-4">
        <p className="text-sm font-bold text-brand-ink">نسخه نمایشی</p>
        <p className="mt-1 text-xs leading-6 text-brand-ink/80">همه‌ی داده‌ها محلی هستند. هر تغییری که بدهید در مرورگر شما ذخیره می‌شود.</p>
      </div>
    </>
  );
}

function Topbar({ onMenu, onSearch, theme }: { onMenu: () => void; onSearch: () => void; theme: { dark: boolean; toggle: () => void } }) {
  const router = useRouter();
  const logout = useStore((s) => s.logout);
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="باز کردن منو">
        <Menu />
      </Button>

      <button onClick={onSearch} className="flex h-10 min-w-0 max-w-md flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 text-sm text-muted transition hover:border-muted/50">
        <Search className="size-4" />
        <span className="flex-1 truncate text-start">جستجوی محصول، سفارش، مشتری…</span>
        <kbd dir="ltr" className="hidden items-center gap-0.5 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] sm:flex">
          <Command className="size-3" />K
        </kbd>
      </button>

      <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Button variant="ghost" size="icon" onClick={theme.toggle} aria-label={theme.dark ? "تم روشن" : "تم تیره"}>
          {theme.dark ? <Sun /> : <Moon />}
        </Button>
        <Notifications />
        <Popover
          align="end"
          className="w-60 p-1.5"
          trigger={({ toggle }) => (
            <button onClick={toggle} className="ms-1 flex items-center gap-2.5 rounded-xl p-1 pe-2 transition hover:bg-surface-2" aria-label="منوی کاربر">
              <Avatar name="مریم کاظمی" size={34} />
              <span className="hidden text-start leading-tight sm:block">
                <span className="block text-[13px] font-bold">مریم کاظمی</span>
                <span className="block text-[11px] text-muted">مدیر فروشگاه</span>
              </span>
            </button>
          )}
        >
          {(close) => (
            <div className="text-sm">
              <div className="border-b border-line px-3 pb-2.5 pt-2">
                <p className="font-bold">مریم کاظمی</p>
                <p className="text-xs text-muted">admin@pooshin.example</p>
              </div>
              <Link href="/settings" onClick={close} className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-surface-2">
                <Settings className="size-4 text-muted" /> تنظیمات
              </Link>
              <button
                onClick={() => {
                  close();
                  logout();
                  router.replace("/login");
                  toast.info("از حساب خود خارج شدید");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-danger hover:bg-danger-soft"
              >
                <LogOut className="size-4" /> خروج
              </button>
            </div>
          )}
        </Popover>
      </div>
    </header>
  );
}

function Notifications() {
  const router = useRouter();
  const items = useStore((s) => s.notifications);
  const { markAllRead, markRead, clearNotifications } = useStore.getState();
  const unread = items.filter((n) => !n.read).length;
  const [, tick] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const t = setInterval(() => tick(++ref.current), 60000);
    return () => clearInterval(t);
  }, []);
  const dot = useMemo(() => ({ order: "bg-brand", stock: "bg-warn", customer: "bg-info", system: "bg-muted" }), []);
  return (
    <Popover
      align="end"
      className="w-[min(92vw,380px)]"
      trigger={({ toggle }) => (
        <Button variant="ghost" size="icon" className="relative" onClick={toggle} aria-label={`اعلان‌ها${unread ? ` (${unread} خوانده‌نشده)` : ""}`}>
          <Bell />
          {unread > 0 && <span className="absolute end-2 top-2 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-bg">{unread > 9 ? "۹+" : unread.toLocaleString("fa-IR")}</span>}
        </Button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-bold">اعلان‌ها</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <CheckCheck /> خوانده شد
              </Button>
              <Button variant="ghost" size="sm" onClick={clearNotifications}>
                پاک‌کردن
              </Button>
            </div>
          </div>
          <ul className="max-h-96 divide-y divide-line/70 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted">اعلان جدیدی ندارید</li>}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    markRead(n.id);
                    close();
                    if (n.href) router.push(n.href);
                  }}
                  className={cn("flex w-full gap-3 px-4 py-3 text-start transition hover:bg-surface-2", !n.read && "bg-brand-soft/30")}
                >
                  <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-line" : dot[n.kind])} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="block truncate text-[13px] text-muted">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{relative(n.at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Popover>
  );
}

