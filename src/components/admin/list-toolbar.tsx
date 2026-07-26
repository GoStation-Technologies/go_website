import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SortOption<K extends string = string> = { value: K; label: string };

export type ListViewSearch = {
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function useListView<T>(opts: {
  rows: T[];
  search: (row: T) => string;
  sort: Record<string, (a: T, b: T) => number>;
  defaultSort: string;
  defaultPageSize?: number;
}) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as ListViewSearch;

  const q = search.q ?? "";
  const sort = search.sort ?? opts.defaultSort;
  const pageSize = search.pageSize ?? opts.defaultPageSize ?? 10;
  const page = search.page ?? 1;

  const update = (patch: ListViewSearch) => {
    navigate({
      to: ".",
      search: (prev: ListViewSearch) => {
        const next: ListViewSearch = { ...prev, ...patch };
        // strip defaults so URL stays clean
        if (!next.q) delete next.q;
        if (!next.sort || next.sort === opts.defaultSort) delete next.sort;
        if (!next.pageSize || next.pageSize === (opts.defaultPageSize ?? 10)) delete next.pageSize;
        if (!next.page || next.page === 1) delete next.page;
        return next;
      },
      replace: true,
    });
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const src = needle
      ? opts.rows.filter((r) => opts.search(r).toLowerCase().includes(needle))
      : opts.rows.slice();
    const cmp = opts.sort[sort];
    if (cmp) src.sort(cmp);
    return src;
  }, [opts.rows, opts.search, opts.sort, q, sort]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  return {
    q, setQ: (v: string) => update({ q: v, page: 1 }),
    sort, setSort: (v: string) => update({ sort: v, page: 1 }),
    page: safePage, setPage: (n: number) => update({ page: n }),
    pageSize, setPageSize: (v: number) => update({ pageSize: v, page: 1 }),
    pageCount, total, pageRows,
  };
}

export function ListToolbar(props: {
  q: string; onQ: (v: string) => void;
  sort: string; onSort: (v: string) => void;
  sortOptions: SortOption[];
  pageSize: number; onPageSize: (v: number) => void;
  page: number; pageCount: number; total: number; onPage: (n: number) => void;
  searchPlaceholder?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          value={props.q}
          onChange={(e) => props.onQ(e.target.value)}
          placeholder={props.searchPlaceholder ?? t("admin.common.search")}
          className="max-w-xs"
        />
        <select
          value={props.sort}
          onChange={(e) => props.onSort(e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          {props.sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={props.pageSize}
          onChange={(e) => props.onPageSize(Number(e.target.value))}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{t("admin.common.perPage", { n })}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {props.total === 0 ? "0" : `${(props.page - 1) * props.pageSize + 1}–${Math.min(props.page * props.pageSize, props.total)}`} {" "}{t("admin.common.of")} {props.total}
        </span>
        <Button size="sm" variant="outline" disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)}>{t("admin.common.prev")}</Button>
        <span className="tabular-nums">{props.page} / {props.pageCount}</span>
        <Button size="sm" variant="outline" disabled={props.page >= props.pageCount} onClick={() => props.onPage(props.page + 1)}>{t("admin.common.next")}</Button>
      </div>
    </div>
  );
}

export const listViewSearchSchema = {
  q: (v: unknown) => (typeof v === "string" ? v : undefined),
  sort: (v: unknown) => (typeof v === "string" ? v : undefined),
  page: (v: unknown) => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
  },
  pageSize: (v: unknown) => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
  },
};

export function validateListViewSearch(input: Record<string, unknown>): ListViewSearch {
  const out: ListViewSearch = {};
  const q = listViewSearchSchema.q(input.q);
  const sort = listViewSearchSchema.sort(input.sort);
  const page = listViewSearchSchema.page(input.page);
  const pageSize = listViewSearchSchema.pageSize(input.pageSize);
  if (q) out.q = q;
  if (sort) out.sort = sort;
  if (page) out.page = page;
  if (pageSize) out.pageSize = pageSize;
  return out;
}
