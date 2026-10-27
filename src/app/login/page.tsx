"use client";

import { ArrowLeft, Lock, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, Input } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const hydrated = useStore((s) => s.hydrated);
  const authed = useStore((s) => s.authed);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => useStore.getState().init());
  }, []);
  useEffect(() => {
    if (hydrated && authed) router.replace("/");
  }, [hydrated, authed, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      login();
      router.replace("/");
    }, 650);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand text-xl font-black text-brand-fg">پ</span>
            <div>
              <p className="text-xl font-extrabold leading-tight">پوشین</p>
              <p className="text-xs text-muted">پنل مدیریت فروشگاه</p>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">خوش آمدید 👋</h1>
            <p className="mt-1.5 text-sm text-muted">برای ادامه وارد حساب مدیریت شوید.</p>
          </div>
          <div className="space-y-4">
            <Field label="ایمیل">{(id) => <Input id={id} icon={<Mail />} defaultValue="admin@pooshin.example" dir="ltr" className="text-end" autoComplete="email" />}</Field>
            <Field label="رمز عبور">{(id) => <Input id={id} icon={<Lock />} type="password" defaultValue="demo1234" dir="ltr" className="text-end" autoComplete="current-password" />}</Field>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy || !hydrated}>
            {busy ? "در حال ورود…" : "ورود به پنل"}
            {!busy && <ArrowLeft />}
          </Button>
          <p className="rounded-xl bg-brand-soft p-3 text-xs leading-6 text-brand-ink">این یک نسخه‌ی نمایشی است؛ اطلاعات ورود از قبل پر شده و کافی است دکمه‌ی ورود را بزنید.</p>
        </form>
      </div>

      <div className="relative hidden overflow-hidden bg-brand lg:block">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,#fff_0,transparent_45%),radial-gradient(circle_at_80%_70%,#000_0,transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-14 text-brand-fg">
          <Sparkles className="size-8 opacity-80" />
          <div>
            <p className="text-4xl font-black leading-snug">فروشگاه‌تان را<br />هوشمندانه مدیریت کنید.</p>
            <p className="mt-4 max-w-md text-base leading-8 opacity-85">سفارش‌ها، موجودی انبار، مشتریان و گزارش‌های فروش، همه در یک پنل سریع و روان.</p>
          </div>
          <p className="text-sm opacity-70">© پوشین · نسخه نمایشی</p>
        </div>
      </div>
    </div>
  );
}
