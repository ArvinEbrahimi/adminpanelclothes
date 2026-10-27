"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { create } from "zustand";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

function useOverlay(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => ref.current?.querySelector<HTMLElement>("[data-autofocus],input,select,textarea")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return ref;
}

function Portal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return mounted ? createPortal(children, document.body) : null;
}

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  desc?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, desc, children, footer, width = "max-w-lg" }: OverlayProps) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="absolute inset-0 animate-[fade-in_.2s] bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
        <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cn("relative flex max-h-[90dvh] w-full animate-[pop-in_.22s_ease-out] flex-col rounded-2xl border border-line bg-surface shadow-2xl", width)}>
          <div className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
            </div>
            <Button variant="ghost" size="icon" className="-m-2 size-9" onClick={onClose} aria-label="بستن">
              <X />
            </Button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

export function Drawer({ open, onClose, title, desc, children, footer, width = "max-w-xl" }: OverlayProps) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 animate-[fade-in_.2s] bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
        <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cn("absolute inset-y-0 end-0 flex w-full animate-[slide-in-end_.25s_ease-out] flex-col border-s border-line bg-surface shadow-2xl", width)}>
          <div className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{title}</h2>
              {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
            </div>
            <Button variant="ghost" size="icon" className="-m-2 size-9" onClick={onClose} aria-label="بستن">
              <X />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/* ---------- Promise-based confirm ---------- */
interface ConfirmOpts {
  title: string;
  desc?: string;
  confirmText?: string;
  danger?: boolean;
}
const useConfirmStore = create<{ opts: ConfirmOpts | null; resolve: ((v: boolean) => void) | null }>(() => ({ opts: null, resolve: null }));

export function confirmDialog(opts: ConfirmOpts) {
  return new Promise<boolean>((resolve) => useConfirmStore.setState({ opts, resolve }));
}

export function ConfirmHost() {
  const { opts, resolve } = useConfirmStore();
  const close = (v: boolean) => {
    resolve?.(v);
    useConfirmStore.setState({ opts: null, resolve: null });
  };
  return (
    <Modal
      open={!!opts}
      onClose={() => close(false)}
      title={opts?.title ?? ""}
      width="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={() => close(false)}>
            انصراف
          </Button>
          <Button variant={opts?.danger ? "danger" : "primary"} onClick={() => close(true)} data-autofocus>
            {opts?.confirmText ?? "تأیید"}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {opts?.danger && (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="size-5" />
          </span>
        )}
        <p className="text-sm leading-7 text-muted">{opts?.desc}</p>
      </div>
    </Modal>
  );
}
