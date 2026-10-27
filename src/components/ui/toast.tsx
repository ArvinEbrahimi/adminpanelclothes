"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
}

const useToasts = create<{ items: ToastItem[]; dismiss: (id: number) => void }>((set) => ({
  items: [],
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

let seq = 0;
function add(kind: ToastItem["kind"], text: string) {
  const id = ++seq;
  useToasts.setState((s) => ({ items: [...s.items.slice(-3), { id, kind, text }] }));
  setTimeout(() => useToasts.getState().dismiss(id), 4200);
}

export const toast = {
  success: (t: string) => add("success", t),
  error: (t: string) => add("error", t),
  info: (t: string) => add("info", t),
};

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLOR = { success: "text-success", error: "text-danger", info: "text-info" };

export function ToastHost() {
  const { items, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-start sm:ps-6" aria-live="polite">
      {items.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-[toast-in_.25s_ease-out] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg">
            <Icon className={cn("size-5 shrink-0", COLOR[t.kind])} />
            <p className="flex-1 text-sm">{t.text}</p>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-fg" aria-label="بستن">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
