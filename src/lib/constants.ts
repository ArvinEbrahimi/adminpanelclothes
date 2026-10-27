import type { AccentKey, Category, OrderStatus, PaymentMethod, ProductStatus, Size } from "./types";

export type Tone = "neutral" | "brand" | "success" | "warn" | "danger" | "info";

export const CATEGORIES: Record<Category, string> = {
  shirt: "پیراهن و بلوز",
  tshirt: "تی‌شرت و هودی",
  pants: "شلوار و دامن",
  jacket: "کت و پالتو",
  dress: "مانتو و پیراهن بلند",
  shoes: "کفش",
  bag: "کیف",
  accessory: "اکسسوری",
};

export const LETTER_SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
export const SHOE_SIZES: Size[] = ["36", "37", "38", "39", "40", "41", "42", "43", "44"];

export function sizesFor(c: Category): Size[] {
  if (c === "shoes") return SHOE_SIZES;
  if (c === "bag" || c === "accessory") return ["FREE"];
  return LETTER_SIZES;
}
export const sizeLabel = (s: Size) => (s === "FREE" ? "فری‌سایز" : s);

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: "در انتظار پرداخت", tone: "warn" },
  paid: { label: "پرداخت‌شده", tone: "info" },
  processing: { label: "در حال آماده‌سازی", tone: "brand" },
  shipped: { label: "ارسال‌شده", tone: "info" },
  delivered: { label: "تحویل‌شده", tone: "success" },
  cancelled: { label: "لغو‌شده", tone: "danger" },
  returned: { label: "مرجوعی", tone: "neutral" },
};
export const FLOW: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"];
export const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: "تأیید پرداخت",
  paid: "شروع آماده‌سازی",
  processing: "ثبت ارسال",
  shipped: "ثبت تحویل",
};

export const PRODUCT_STATUS: Record<ProductStatus, { label: string; tone: Tone }> = {
  active: { label: "فعال", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "warn" },
  archived: { label: "بایگانی", tone: "neutral" },
};

export const PAYMENT: Record<PaymentMethod, string> = {
  online: "پرداخت آنلاین",
  cod: "پرداخت در محل",
  card: "کارت به کارت",
};

export const ACCENTS: Record<AccentKey, { label: string; swatch: string }> = {
  emerald: { label: "زمرد", swatch: "#178168" },
  indigo: { label: "نیلی", swatch: "#4f46e5" },
  rose: { label: "یاقوتی", swatch: "#be185d" },
  amber: { label: "کهربایی", swatch: "#b45309" },
  slate: { label: "دودی", swatch: "#334155" },
};

export const CITIES = ["تهران", "اصفهان", "شیراز", "مشهد", "تبریز", "کرج", "رشت", "اهواز", "قم", "یزد", "کرمانشاه", "ساری"];
