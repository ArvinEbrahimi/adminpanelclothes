"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ORDER_STATUS, sizesFor } from "./constants";
import { toman } from "./format";
import { toast } from "@/components/ui/toast";
import { makeSeed } from "./seed";
import type { Activity, Coupon, Customer, Notification, Order, OrderItem, OrderStatus, PaymentMethod, Product, Settings, Size } from "./types";
import { uid } from "./utils";

export const DEFAULT_SETTINGS: Settings = {
  storeName: "پوشین",
  email: "support@pooshin.example",
  phone: "۰۲۱-۴۲۰۰۰۰۰۰",
  address: "تهران، خیابان ولیعصر، پلاک ۱۲۰",
  lowStockThreshold: 5,
  shippingFee: 85000,
  freeShippingFrom: 2000000,
  liveOrders: true,
  accent: "emerald",
  notifyOrders: true,
  notifyStock: true,
};

export const totalStock = (p: Product) => Object.values(p.stock).reduce((s, n) => s + (n ?? 0), 0);

interface State {
  hydrated: boolean;
  seeded: boolean;
  authed: boolean;
  products: Product[];
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  notifications: Notification[];
  activity: Activity[];
  settings: Settings;

  init: () => void;
  login: () => void;
  logout: () => void;
  resetDemo: () => void;

  saveProduct: (p: Product) => void;
  deleteProducts: (ids: string[]) => void;
  setProductStatus: (ids: string[], status: Product["status"]) => void;
  setStock: (id: string, size: Size, qty: number) => void;

  setOrderStatus: (id: string, status: OrderStatus) => void;
  createOrder: (input: { customerId: string; items: OrderItem[]; payment: PaymentMethod; couponCode?: string; note?: string }) => Order | null;
  simulateOrder: () => void;

  saveCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;

  saveCoupon: (c: Coupon) => void;
  deleteCoupon: (id: string) => void;
  toggleCoupon: (id: string) => void;

  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;

  updateSettings: (s: Partial<Settings>) => void;
}

const log = (text: string): Activity => ({ id: uid(), text, at: Date.now() });

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const push = (n: Omit<Notification, "id" | "at" | "read">) =>
        set((s) => ({ notifications: [{ ...n, id: uid(), at: Date.now(), read: false }, ...s.notifications].slice(0, 40) }));
      const addLog = (text: string) => set((s) => ({ activity: [log(text), ...s.activity].slice(0, 40) }));

      /** reduce stock for items, return notifications for low stock */
      const adjustStock = (products: Product[], items: OrderItem[], dir: 1 | -1) =>
        products.map((p) => {
          const mine = items.filter((i) => i.productId === p.id);
          if (!mine.length) return p;
          const stock = { ...p.stock };
          mine.forEach((i) => (stock[i.size] = Math.max(0, (stock[i.size] ?? 0) + dir * i.qty)));
          return { ...p, stock };
        });

      return {
        hydrated: false,
        seeded: false,
        authed: false,
        products: [],
        orders: [],
        customers: [],
        coupons: [],
        notifications: [],
        activity: [],
        settings: DEFAULT_SETTINGS,

        init: () => {
          if (!get().seeded) {
            const seed = makeSeed();
            set({ ...seed, seeded: true, activity: [log("داده‌ی نمونه بارگذاری شد")] });
          }
          set({ hydrated: true });
        },
        login: () => set({ authed: true }),
        logout: () => set({ authed: false }),
        resetDemo: () => {
          const seed = makeSeed();
          set({ ...seed, seeded: true, settings: DEFAULT_SETTINGS, activity: [log("داده‌ی نمونه بازنشانی شد")] });
        },

        saveProduct: (p) => {
          const exists = get().products.some((x) => x.id === p.id);
          set((s) => ({ products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] }));
          addLog(`${exists ? "ویرایش" : "افزودن"} محصول «${p.name}»`);
        },
        deleteProducts: (ids) => {
          set((s) => ({ products: s.products.filter((p) => !ids.includes(p.id)) }));
          addLog(`${ids.length} محصول حذف شد`);
        },
        setProductStatus: (ids, status) => {
          set((s) => ({ products: s.products.map((p) => (ids.includes(p.id) ? { ...p, status } : p)) }));
        },
        setStock: (id, size, qty) => {
          set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, stock: { ...p.stock, [size]: Math.max(0, qty) } } : p)) }));
        },

        setOrderStatus: (id, status) => {
          const order = get().orders.find((o) => o.id === id);
          if (!order || order.status === status) return;
          const restock = (status === "cancelled" || status === "returned") && order.status !== "cancelled" && order.status !== "returned";
          set((s) => ({
            orders: s.orders.map((o) => (o.id === id ? { ...o, status, events: [...o.events, { status, at: Date.now() }] } : o)),
            products: restock ? adjustStock(s.products, order.items, 1) : s.products,
          }));
          addLog(`سفارش ${order.number}: ${ORDER_STATUS[status].label}`);
        },

        createOrder: ({ customerId, items, payment, couponCode, note }) => {
          const { customers, coupons, settings } = get();
          const customer = customers.find((c) => c.id === customerId);
          if (!customer || !items.length) return null;
          const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
          const coupon = couponCode ? coupons.find((c) => c.code === couponCode.toUpperCase() && c.active && c.expiresAt > Date.now() && subtotal >= c.minOrder) : undefined;
          const discount = coupon ? (coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value) : 0;
          const shipping = subtotal >= settings.freeShippingFrom ? 0 : settings.shippingFee;
          const number = Math.max(10000, ...get().orders.map((o) => o.number)) + 1;
          const now = Date.now();
          const order: Order = {
            id: `o${number}`,
            number,
            customerId,
            items,
            status: payment === "cod" ? "paid" : "pending",
            payment,
            subtotal,
            discount,
            shipping,
            total: subtotal - discount + shipping,
            couponCode: coupon?.code,
            city: customer.city,
            address: `${customer.city}، خیابان ولیعصر، پلاک ${Math.floor(Math.random() * 150) + 1}`,
            note,
            createdAt: now,
            events: [{ status: "pending", at: now }],
          };
          if (order.status === "paid") order.events.push({ status: "paid", at: now });
          set((s) => ({
            orders: [order, ...s.orders],
            products: adjustStock(s.products, items, -1),
            coupons: coupon ? s.coupons.map((c) => (c.id === coupon.id ? { ...c, used: c.used + 1 } : c)) : s.coupons,
          }));
          addLog(`سفارش ${number} ثبت شد (${toman(order.total)})`);
          return order;
        },

        simulateOrder: () => {
          const { products, customers, settings } = get();
          const pool = products.filter((p) => p.status === "active" && totalStock(p) > 0);
          if (!pool.length || !customers.length) return;
          const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
          const items: OrderItem[] = Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => {
            const p = pick(pool);
            const sizes = sizesFor(p.category).filter((s) => (p.stock[s] ?? 0) > 0);
            const col = pick(p.colors);
            return { productId: p.id, name: p.name, category: p.category, size: pick(sizes.length ? sizes : sizesFor(p.category)), color: col.name, colorHex: col.hex, qty: 1, price: p.salePrice ?? p.price };
          });
          const customer = pick(customers);
          const order = get().createOrder({ customerId: customer.id, items, payment: pick<PaymentMethod>(["online", "online", "cod", "card"]) });
          if (order && settings.notifyOrders) {
            push({ kind: "order", title: "سفارش جدید رسید", body: `سفارش ${order.number} از ${customer.name} · ${toman(order.total)}`, href: "/orders" });
            toast.info(`سفارش جدید: ${customer.name} · ${toman(order.total)}`);
          }
          // low stock alert
          if (settings.notifyStock) {
            const low = get().products.find((p) => items.some((i) => i.productId === p.id) && (get().products.find((x) => x.id === p.id)!.stock[items.find((i) => i.productId === p.id)!.size] ?? 0) <= settings.lowStockThreshold);
            if (low) push({ kind: "stock", title: "هشدار موجودی", body: `«${low.name}» رو به اتمام است`, href: "/inventory" });
          }
        },

        saveCustomer: (c) => {
          const exists = get().customers.some((x) => x.id === c.id);
          set((s) => ({ customers: exists ? s.customers.map((x) => (x.id === c.id ? c : x)) : [c, ...s.customers] }));
          addLog(`${exists ? "ویرایش" : "افزودن"} مشتری «${c.name}»`);
        },
        deleteCustomer: (id) => {
          set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
          addLog("یک مشتری حذف شد");
        },

        saveCoupon: (c) => {
          const exists = get().coupons.some((x) => x.id === c.id);
          set((s) => ({ coupons: exists ? s.coupons.map((x) => (x.id === c.id ? c : x)) : [c, ...s.coupons] }));
          addLog(`${exists ? "ویرایش" : "ساخت"} کد تخفیف ${c.code}`);
        },
        deleteCoupon: (id) => set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),
        toggleCoupon: (id) => set((s) => ({ coupons: s.coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) })),

        markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
        markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        clearNotifications: () => set({ notifications: [] }),

        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      };
    },
    {
      name: "pooshin-demo-v1",
      skipHydration: true,
      partialize: (s) => ({
        seeded: s.seeded,
        authed: s.authed,
        products: s.products,
        orders: s.orders,
        customers: s.customers,
        coupons: s.coupons,
        notifications: s.notifications,
        activity: s.activity,
        settings: s.settings,
      }),
    },
  ),
);
