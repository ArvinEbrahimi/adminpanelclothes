import { CITIES, sizesFor } from "./constants";
import { DAY } from "./format";
import type { Category, ColorOption, Coupon, Customer, Notification, Order, OrderEvent, OrderItem, OrderStatus, PaymentMethod, Product, Size } from "./types";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLORS: ColorOption[] = [
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

/** price range is in thousand tomans */
const CATALOG: Record<Category, { names: string[]; price: [number, number] }> = {
  shirt: { names: ["پیراهن کتان آکسفورد", "بلوز حریر یقه‌دار", "پیراهن راه‌راه کلاسیک", "بلوز ساتن دکمه‌دار", "پیراهن جین نیم‌رسمی"], price: [680, 1450] },
  tshirt: { names: ["تی‌شرت نخی اورسایز", "هودی پشمی زیپ‌دار", "سویشرت یقه‌گرد", "تی‌شرت پولوی ساده", "هودی کلاه‌دار"], price: [390, 1150] },
  pants: { names: ["شلوار کتان راسته", "شلوار جین مام‌فیت", "دامن پلیسه بلند", "شلوار پارچه‌ای فاق‌بلند", "شلوار گشاد لینن"], price: [720, 1680] },
  jacket: { names: ["کت تک پشمی", "پالتو بلند دورو", "ژاکت بافت کابلی", "بارانی کلاسیک", "کاپشن پفی سبک"], price: [1850, 5400] },
  dress: { names: ["مانتو لینن تابستانه", "پیراهن بلند گلدار", "مانتو جلوباز کتان", "پیراهن ماکسی ساتن", "مانتو اسپرت کلاه‌دار"], price: [980, 2650] },
  shoes: { names: ["کفش چرم دستدوز", "کتانی سفید کلاسیک", "نیم‌بوت چرم", "کفش راحتی روزمره", "صندل چرم تابستانه"], price: [1250, 3600] },
  bag: { names: ["کیف دوشی چرم", "کوله شهری ضدآب", "کیف دستی مینیمال", "ساک ورزشی"], price: [850, 2900] },
  accessory: { names: ["شال نخی ساده", "کمربند چرم طبیعی", "کلاه کپ کتان", "روسری ابریشم", "دستکش چرم"], price: [180, 780] },
};

const FIRST = ["علی", "محمد", "رضا", "حسین", "امیر", "سارا", "مریم", "زهرا", "نگار", "ندا", "پریسا", "کیان", "بهنام", "الهام", "سمانه", "آرش", "مهسا", "نیما", "شیما", "فرزاد", "ترانه", "یاسمن", "پویا", "هانیه", "مهدی", "فاطمه", "سینا", "نازنین", "کامران", "ریحانه"];
const LAST = ["احمدی", "رضایی", "کریمی", "حسینی", "موسوی", "جعفری", "صادقی", "نوری", "کاظمی", "یزدانی", "قاسمی", "اکبری", "رحیمی", "عباسی", "سلطانی", "مرادی", "فرهادی", "طاهری", "بهرامی", "پناهی"];
const STREETS = ["خیابان ولیعصر", "بلوار کشاورز", "خیابان شریعتی", "خیابان انقلاب", "بلوار امام رضا", "خیابان چهارباغ", "خیابان ملاصدرا", "بلوار ارم"];
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export interface SeedData {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  coupons: Coupon[];
  notifications: Notification[];
}

export function makeSeed(now = Date.now()): SeedData {
  const r = rng(1405);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const between = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));

  // ---- products
  const products: Product[] = [];
  let n = 0;
  (Object.keys(CATALOG) as Category[]).forEach((cat) => {
    CATALOG[cat].names.forEach((name) => {
      const variants = cat === "shoes" || cat === "bag" || cat === "accessory" ? 1 : 2;
      for (let v = 0; v < variants; v++) {
        n++;
        const [lo, hi] = CATALOG[cat].price;
        const price = Math.round(between(lo, hi) / 10) * 10 * 1000;
        const colors = Array.from(new Set([pick(COLORS), pick(COLORS), pick(COLORS)])).slice(0, between(1, 3));
        const stock: Product["stock"] = {};
        sizesFor(cat).forEach((s) => (stock[s] = r() < 0.12 ? 0 : r() < 0.2 ? between(1, 3) : between(4, 30)));
        const sale = r() < 0.25 ? Math.round((price * (1 - between(10, 35) / 100)) / 10000) * 10000 : undefined;
        products.push({
          id: `p${n}`,
          name: v === 0 ? name : `${name} (${colors[0].name})`,
          sku: `PSH-${cat.slice(0, 2).toUpperCase()}-${1000 + n}`,
          category: cat,
          description: "پارچه‌ی مرغوب، دوخت دقیق و برش مدرن. مناسب استفاده‌ی روزمره و مجلسی با حفظ راحتی و ماندگاری رنگ بعد از شست‌وشو.",
          price,
          salePrice: sale,
          cost: Math.round((price * (0.45 + r() * 0.2)) / 1000) * 1000,
          colors,
          stock,
          status: r() < 0.88 ? "active" : r() < 0.7 ? "draft" : "archived",
          featured: r() < 0.18,
          rating: Math.round((3.8 + r() * 1.2) * 10) / 10,
          createdAt: now - between(10, 400) * DAY,
        });
      }
    });
  });

  // ---- customers
  const customers: Customer[] = Array.from({ length: 64 }, (_, i) => {
    const phone = `09${between(10, 39)}${between(1000000, 9999999)}`.replace(/\d/g, (d) => FA_DIGITS[+d]);
    return {
      id: `c${i + 1}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      phone,
      email: `user${i + 1}@example.com`,
      city: r() < 0.4 ? "تهران" : pick(CITIES),
      joinedAt: now - between(5, 380) * DAY,
    };
  });

  // ---- orders
  const orders: Order[] = [];
  const active = products.filter((p) => p.status === "active");
  const days = 190;
  let num = 10000;
  for (let d = days; d >= 0; d--) {
    const growth = 1 + (days - d) / days;
    const weekday = new Date(now - d * DAY).getDay();
    const wk = weekday === 4 || weekday === 5 ? 1.35 : weekday === 6 ? 0.8 : 1;
    const count = Math.max(0, Math.round((2 + r() * 3) * growth * wk));
    for (let k = 0; k < count; k++) {
      num++;
      const cust = pick(customers);
      if (cust.joinedAt > now - d * DAY) cust.joinedAt = now - d * DAY - between(0, 3) * DAY;
      const items: OrderItem[] = Array.from({ length: between(1, 3) }, () => {
        const p = pick(active);
        const col = pick(p.colors);
        return { productId: p.id, name: p.name, category: p.category, size: pick(sizesFor(p.category)) as Size, color: col.name, colorHex: col.hex, qty: r() < 0.8 ? 1 : 2, price: p.salePrice ?? p.price };
      });
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const discount = r() < 0.18 ? Math.round((subtotal * between(5, 20)) / 100 / 1000) * 1000 : 0;
      const shipping = subtotal >= 2000000 ? 0 : 85000;
      const createdAt = now - d * DAY + between(8, 22) * 3600000 + between(0, 59) * 60000;
      const x = r();
      let status: OrderStatus;
      if (d > 9) status = x < 0.86 ? "delivered" : x < 0.93 ? "cancelled" : "returned";
      else if (d > 4) status = x < 0.55 ? "delivered" : x < 0.85 ? "shipped" : x < 0.93 ? "processing" : "cancelled";
      else if (d > 1) status = x < 0.25 ? "shipped" : x < 0.6 ? "processing" : x < 0.85 ? "paid" : x < 0.93 ? "pending" : "cancelled";
      else status = x < 0.15 ? "processing" : x < 0.55 ? "paid" : x < 0.9 ? "pending" : "cancelled";
      const pm = r();
      orders.push({
        id: `o${num}`,
        number: num,
        customerId: cust.id,
        items,
        status,
        payment: (pm < 0.62 ? "online" : pm < 0.85 ? "cod" : "card") as PaymentMethod,
        subtotal,
        discount,
        shipping,
        total: subtotal - discount + shipping,
        couponCode: discount ? pick(["BAHAR", "WELCOME10", "VIP15"]) : undefined,
        city: cust.city,
        address: `${cust.city}، ${pick(STREETS)}، پلاک ${between(1, 160)}، واحد ${between(1, 12)}`,
        createdAt,
        events: buildEvents(status, createdAt),
      });
    }
  }
  orders.sort((a, b) => b.createdAt - a.createdAt);

  const coupons: Coupon[] = [
    { id: "k1", code: "WELCOME10", type: "percent", value: 10, minOrder: 500000, usageLimit: 500, used: 214, expiresAt: now + 60 * DAY, active: true },
    { id: "k2", code: "BAHAR", type: "percent", value: 15, minOrder: 1500000, usageLimit: 200, used: 187, expiresAt: now + 9 * DAY, active: true },
    { id: "k3", code: "VIP15", type: "percent", value: 15, minOrder: 3000000, usageLimit: 100, used: 41, expiresAt: now + 120 * DAY, active: true },
    { id: "k4", code: "FREESHIP", type: "fixed", value: 85000, minOrder: 1000000, usageLimit: 1000, used: 640, expiresAt: now + 30 * DAY, active: true },
    { id: "k5", code: "YALDA", type: "percent", value: 30, minOrder: 2000000, usageLimit: 150, used: 150, expiresAt: now - 20 * DAY, active: false },
  ];

  const notifications: Notification[] = [
    { id: "n1", kind: "stock", title: "موجودی رو به اتمام", body: "چند محصول به آستانه‌ی هشدار موجودی رسیده‌اند.", at: now - 3 * 3600000, read: false, href: "/inventory" },
    { id: "n2", kind: "order", title: "سفارش جدید", body: `سفارش ${num} ثبت شد.`, at: now - 5 * 3600000, read: false, href: "/orders" },
    { id: "n3", kind: "system", title: "کد تخفیف BAHAR رو به پایان است", body: "تنها چند روز تا انقضای این کد مانده.", at: now - DAY, read: true, href: "/coupons" },
  ];

  return { products, customers, orders, coupons, notifications };
}

function buildEvents(status: OrderStatus, createdAt: number): OrderEvent[] {
  const ev: OrderEvent[] = [{ status: "pending", at: createdAt }];
  if (status === "cancelled") return [...ev, { status: "cancelled", at: createdAt + 2 * 3600000 }];
  const steps: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];
  const upTo = status === "returned" ? 4 : steps.indexOf(status) + 1;
  let t = createdAt;
  for (let i = 0; i < upTo; i++) {
    t += (i + 1) * 5 * 3600000;
    ev.push({ status: steps[i], at: t });
  }
  if (status === "returned") ev.push({ status: "returned", at: t + 3 * DAY });
  return ev;
}
