const nf = new Intl.NumberFormat("fa-IR");
const cf = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const dateF = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "long", day: "numeric" });
const shortF = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" });
const monthF = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long" });
const timeF = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });
const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });

export const num = (n: number) => nf.format(Math.round(n));
const plain = new Intl.NumberFormat("fa-IR", { useGrouping: false });
/** Identifier-style number (order no.), never grouped: ۱۱۰۷۰ */
export const orderNo = (n: number) => plain.format(n);
export const toman = (n: number) => `${nf.format(Math.round(n))} تومان`;
export const compact = (n: number) => cf.format(n);
export const pct = (n: number) => `${nf.format(Math.round(n * 10) / 10)}٪`;
export const date = (t: number) => dateF.format(t);
export const shortDate = (t: number) => shortF.format(t);
export const monthName = (t: number) => monthF.format(t);
export const time = (t: number) => timeF.format(t);
export const dateTime = (t: number) => `${dateF.format(t)}، ${timeF.format(t)}`;

export function relative(t: number, now = Date.now()) {
  const diff = (t - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "چند لحظه پیش";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return rtf.format(Math.round(diff / (86400 * 30)), "month");
}

/** Convert Persian/Arabic digits to latin for numeric inputs. */
export function parseNum(v: string): number {
  const map: Record<string, string> = {};
  "۰۱۲۳۴۵۶۷۸۹".split("").forEach((d, i) => (map[d] = String(i)));
  "٠١٢٣٤٥٦٧٨٩".split("").forEach((d, i) => (map[d] = String(i)));
  const clean = v.replace(/[۰-۹٠-٩]/g, (d) => map[d]).replace(/[^\d.]/g, "");
  return clean ? Number(clean) : 0;
}

export const DAY = 86400000;
