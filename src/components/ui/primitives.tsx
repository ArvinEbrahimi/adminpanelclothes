"use client";

import { Search } from "lucide-react";
import { forwardRef, useId, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { Tone } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ---------- Button ---------- */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type BtnSize = "sm" | "md" | "lg" | "icon";

const BTN_V: Record<BtnVariant, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand-hover shadow-sm",
  secondary: "bg-surface-2 text-fg hover:bg-line",
  outline: "border border-line bg-surface text-fg hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger text-white hover:opacity-90",
};
const BTN_S: Record<BtnSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-[15px]",
  icon: "size-10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }>(
  ({ className, variant = "primary", size = "md", type = "button", ...p }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn("inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-xl font-medium transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0", BTN_V[variant], BTN_S[size], className)}
      {...p}
    />
  ),
);
Button.displayName = "Button";

/* ---------- Card ---------- */
export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-line bg-surface shadow-card", className)} {...p} />;
}
export function CardHeader({ title, desc, action, className }: { title: ReactNode; desc?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 p-5 pb-0", className)}>
      <div>
        <h3 className="text-[15px] font-bold">{title}</h3>
        {desc && <p className="mt-0.5 text-[13px] text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badge ---------- */
const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  brand: "bg-brand-soft text-brand-ink",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};
export function Badge({ tone = "neutral", dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------- Form controls ---------- */
const CONTROL = "w-full rounded-xl border border-line bg-surface px-3.5 text-sm transition placeholder:text-muted/70 hover:border-muted/50 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }>(({ className, icon, ...p }, ref) => (
  <div className="relative w-full">
    {icon && <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-muted [&_svg]:size-4">{icon}</span>}
    <input ref={ref} className={cn(CONTROL, "h-10", icon && "ps-10", className)} {...p} />
  </div>
));
Input.displayName = "Input";

export function SearchInput(p: InputHTMLAttributes<HTMLInputElement>) {
  return <Input icon={<Search />} type="search" {...p} />;
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(CONTROL.replace("w-full ", ""), className?.includes("w-") ? "" : "w-full", "h-10 cursor-pointer appearance-none bg-[length:16px] bg-[position:left_12px_center] bg-no-repeat pe-3.5 ps-9 [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238d9894' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]", className)} {...p} />
));
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(CONTROL, "min-h-24 py-2.5 leading-7", className)} {...p} />
));
Textarea.displayName = "Textarea";

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-[13px] font-medium">
        {label}
      </label>
      {children(id)}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-brand" : "bg-line")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "start-[22px]" : "start-0.5")} />
    </button>
  );
}

export function Checkbox({ checked, onChange, label, indeterminate }: { checked: boolean; onChange: (v: boolean) => void; label: string; indeterminate?: boolean }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
      }}
      onChange={(e) => onChange(e.target.checked)}
      className="size-4 cursor-pointer rounded border-line accent-[var(--brand)]"
    />
  );
}

/* ---------- Misc ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-[shimmer_1.6s_infinite] rounded-lg bg-[linear-gradient(110deg,var(--surface-2)_30%,var(--line)_50%,var(--surface-2)_70%)] bg-[length:200%_100%]", className)} />;
}

export function Empty({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted [&_svg]:size-6">{icon}</div>
      <div>
        <p className="font-bold">{title}</p>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1", className)}>
      {items.map((i) => (
        <button
          key={i.value}
          role="tab"
          aria-selected={value === i.value}
          onClick={() => onChange(i.value)}
          className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition", value === i.value ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}
        >
          {i.label}
          {i.count !== undefined && <span className={cn("rounded-full px-1.5 text-[11px]", value === i.value ? "bg-brand-soft text-brand-ink" : "bg-line text-muted")}>{i.count.toLocaleString("fa-IR")}</span>}
        </button>
      ))}
    </div>
  );
}

const AVATAR = ["#178168", "#4f46e5", "#be185d", "#b45309", "#0e7490", "#7c3aed", "#475569"];
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const h = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}‌${parts[1][0]}` : parts[0].slice(0, 2);
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, background: AVATAR[h % AVATAR.length], fontSize: size * 0.34 }} aria-hidden>
      {initials}
    </span>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "warn" | "danger" | "success" }) {
  const c = { brand: "bg-brand", warn: "bg-warn", danger: "bg-danger", success: "bg-success" }[tone];
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-500", c)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
