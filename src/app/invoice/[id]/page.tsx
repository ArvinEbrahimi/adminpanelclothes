"use client";

import { ArrowRight, Printer } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ORDER_STATUS, PAYMENT, sizeLabel } from "@/lib/constants";
import { date, dateTime, num, orderNo, toman } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function InvoicePage() {
  return (
    <Suspense>
      <Invoice />
    </Suspense>
  );
}

function Invoice() {
  const { id } = useParams<{ id: string }>();
  const autoPrint = useSearchParams().get("print") === "1";
  const hydrated = useStore((s) => s.hydrated);
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const customer = useStore((s) => s.customers.find((c) => c.id === order?.customerId));
  const shop = useStore((s) => s.settings);

  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => useStore.getState().init());
    // invoices are always printed on white paper, whatever the panel theme is
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (!autoPrint || !order) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [autoPrint, order]);

  if (!hydrated) return <p className="p-10 text-center text-sm text-muted">در حال بارگذاری فاکتور…</p>;
  if (!order) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-bold">سفارش پیدا نشد</p>
          <Link href="/orders" className="mt-3 inline-block text-sm text-brand">بازگشت به سفارش‌ها</Link>
        </div>
      </div>
    );
  }

  const qty = order.items.reduce((s, i) => s + i.qty, 0);
  const cancelled = order.status === "cancelled" || order.status === "returned";
  const paid = order.status !== "pending" && !cancelled;

  return (
    <div className="min-h-dvh bg-neutral-200 py-6 print:bg-white print:py-0">
      {/* toolbar (hidden on paper) */}
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4 print:hidden">
        <Link href={`/orders?open=${order.id}`} className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowRight className="size-4" /> بازگشت به سفارش
        </Link>
        <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-medium text-brand-fg shadow-sm transition hover:bg-brand-hover active:scale-[0.97]">
          <Printer className="size-4" /> چاپ / ذخیره PDF
        </button>
      </div>

      <article className="relative mx-auto min-h-[297mm] max-w-[210mm] overflow-hidden bg-white p-[14mm] text-[13px] leading-6 text-neutral-900 shadow-xl print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
        {cancelled && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="-rotate-12 rounded-2xl border-4 border-red-600/25 px-10 py-3 text-6xl font-black text-red-600/20">{ORDER_STATUS[order.status].label}</span>
          </div>
        )}

        {/* header */}
        <header className="flex items-start justify-between gap-6 border-b-2 border-brand pb-6">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand text-3xl font-black text-brand-fg print:[print-color-adjust:exact]">پ</span>
            <div>
              <h1 className="text-2xl font-extrabold">{shop.storeName}</h1>
              <p className="text-xs text-neutral-500">فروشگاه پوشاک</p>
            </div>
          </div>
          <div className="text-end">
            <p className="text-xl font-extrabold text-brand">فاکتور فروش</p>
            <dl className="mt-2 space-y-0.5 text-xs">
              <div className="flex justify-end gap-2">
                <dt className="text-neutral-500">شماره فاکتور:</dt>
                <dd className="font-bold">{orderNo(order.number)}</dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-neutral-500">تاریخ صدور:</dt>
                <dd className="font-bold">{date(order.createdAt)}</dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-neutral-500">وضعیت:</dt>
                <dd className="font-bold">{ORDER_STATUS[order.status].label}</dd>
              </div>
            </dl>
          </div>
        </header>

        {/* parties */}
        <section className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="mb-2 text-xs font-bold text-neutral-500">فروشنده</p>
            <p className="font-bold">{shop.storeName}</p>
            <p className="text-neutral-600">{shop.address}</p>
            <p className="text-neutral-600">تلفن: <bdi dir="ltr">{shop.phone}</bdi></p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="mb-2 text-xs font-bold text-neutral-500">خریدار</p>
            <p className="font-bold">{customer?.name ?? "مشتری حذف‌شده"}</p>
            <p className="text-neutral-600">{order.address}</p>
            {customer && <p className="text-neutral-600">موبایل: {customer.phone}</p>}
          </div>
        </section>

        {/* items */}
        <table className="mt-6 w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-neutral-100 text-xs text-neutral-600 print:[print-color-adjust:exact]">
              {["ردیف", "شرح کالا", "رنگ / سایز", "تعداد", "قیمت واحد", "مبلغ کل"].map((h, i) => (
                <th key={h} className={`px-3 py-2.5 font-bold ${i >= 4 ? "text-end" : "text-start"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i} className="border-b border-neutral-200 [break-inside:avoid]">
                <td className="px-3 py-3 text-neutral-500">{num(i + 1)}</td>
                <td className="px-3 py-3 font-medium">{it.name}</td>
                <td className="px-3 py-3 text-neutral-600">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="size-2.5 rounded-full border border-neutral-300 print:[print-color-adjust:exact]" style={{ background: it.colorHex }} />
                    {it.color} · {sizeLabel(it.size)}
                  </span>
                </td>
                <td className="px-3 py-3">{num(it.qty)}</td>
                <td className="px-3 py-3 text-end">{num(it.price)}</td>
                <td className="px-3 py-3 text-end font-bold">{num(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1.5 text-[11px] text-neutral-500">مبالغ به تومان است · مجموع اقلام: {num(qty)} عدد</p>

        {/* totals */}
        <section className="mt-6 flex items-start justify-between gap-8 [break-inside:avoid]">
          <div className="max-w-xs flex-1 text-xs text-neutral-600">
            <p className="mb-1 font-bold text-neutral-900">اطلاعات پرداخت</p>
            <p>روش پرداخت: {PAYMENT[order.payment]}</p>
            <p>وضعیت پرداخت: {paid ? "پرداخت‌شده" : cancelled ? "—" : "پرداخت‌نشده"}</p>
            {order.couponCode && <p>کد تخفیف: <span className="font-mono">{order.couponCode}</span></p>}
            {order.note && <p className="mt-2">توضیحات: {order.note}</p>}
          </div>
          <dl className="w-64 shrink-0 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">جمع اقلام</dt>
              <dd>{toman(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">تخفیف</dt>
                <dd><bdi dir="ltr">−{num(order.discount)}</bdi> تومان</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">هزینه ارسال</dt>
              <dd>{order.shipping ? toman(order.shipping) : "رایگان"}</dd>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-brand px-4 py-3 text-base font-extrabold text-brand-fg print:[print-color-adjust:exact]">
              <dt>مبلغ قابل پرداخت</dt>
              <dd>{toman(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* signatures + footer */}
        <section className="mt-14 grid grid-cols-2 gap-10 text-center text-xs text-neutral-500 [break-inside:avoid]">
          <div className="border-t border-neutral-300 pt-2">مهر و امضای فروشنده</div>
          <div className="border-t border-neutral-300 pt-2">امضای خریدار</div>
        </section>
        <footer className="mt-10 border-t border-neutral-200 pt-4 text-center text-[11px] text-neutral-500">
          از خرید شما سپاسگزاریم 💚 · {shop.storeName} · <bdi dir="ltr">{shop.phone}</bdi> · <bdi dir="ltr">{shop.email}</bdi>
          <br />
          صادر شده در {dateTime(order.createdAt)} · این فاکتور نسخه‌ی نمایشی است
        </footer>
      </article>
    </div>
  );
}
