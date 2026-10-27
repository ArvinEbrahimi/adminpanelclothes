"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button, Checkbox } from "./primitives";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sort?: (row: T) => number | string;
  className?: string;
  hideBelow?: "sm" | "md" | "lg";
}

const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
  empty?: ReactNode;
  defaultSort?: { key: string; dir: "asc" | "desc" };
}

export function DataTable<T>({ rows, columns, rowKey, pageSize = 10, onRowClick, selectable, selected = [], onSelect, empty, defaultSort }: Props<T>) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const [rawPage, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sort || !sort) return rows;
    const f = col.sort;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = f(a);
      const y = f(b);
      return (typeof x === "string" ? x.localeCompare(y as string, "fa") : (x as number) - (y as number)) * dir;
    });
  }, [rows, columns, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(rawPage, pages - 1);
  const view = sorted.slice(page * pageSize, page * pageSize + pageSize);
  const viewIds = view.map(rowKey);
  const allSelected = viewIds.length > 0 && viewIds.every((id) => selected.includes(id));

  const toggleSort = (key: string) => setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));

  if (!rows.length) return <>{empty}</>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-start text-xs text-muted">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <Checkbox label="انتخاب همه" checked={allSelected} indeterminate={!allSelected && viewIds.some((id) => selected.includes(id))} onChange={(v) => onSelect?.(v ? Array.from(new Set([...selected, ...viewIds])) : selected.filter((id) => !viewIds.includes(id)))} />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-4 py-3 text-start font-medium", c.hideBelow && HIDE[c.hideBelow], c.className)} aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                  {c.sort ? (
                    <button onClick={() => toggleSort(c.key)} className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-fg">
                      {c.header}
                      {sort?.key === c.key ? sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((row) => {
              const id = rowKey(row);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("border-b border-line/70 last:border-0 transition-colors", onRowClick && "cursor-pointer hover:bg-surface-2/70", selected.includes(id) && "bg-brand-soft/40")}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox label="انتخاب ردیف" checked={selected.includes(id)} onChange={(v) => onSelect?.(v ? [...selected, id] : selected.filter((x) => x !== id))} />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3", c.hideBelow && HIDE[c.hideBelow], c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
          <span>
            {num(page * pageSize + 1)}–{num(Math.min(sorted.length, (page + 1) * pageSize))} از {num(sorted.length)}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="صفحه قبل">
              <ChevronRight />
            </Button>
            <span className="min-w-16 text-center">
              {num(page + 1)} / {num(pages)}
            </span>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="صفحه بعد">
              <ChevronLeft />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
