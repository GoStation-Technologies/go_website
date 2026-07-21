import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SortOption<K extends string = string> = { value: K; label: string };

export function useListView<T>(opts: {
  rows: T[];
  search: (row: T) => string;
  sort: Record<string, (a: T, b: T) => number>;
  defaultSort: string;
  defaultPageSize?: number;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(opts.defaultSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(opts.defaultPageSize ?? 10);

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
    q, setQ: (v: string) => { setQ(v); setPage(1); },
    sort, setSort: (v: string) => { setSort(v); setPage(1); },
    page: safePage, setPage,
    pageSize, setPageSize: (v: number) => { setPageSize(v); setPage(1); },
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
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          value={props.q}
          onChange={(e) => props.onQ(e.target.value)}
          placeholder={props.searchPlaceholder ?? "Search…"}
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
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {props.total === 0 ? "0" : `${(props.page - 1) * props.pageSize + 1}–${Math.min(props.page * props.pageSize, props.total)}`} of {props.total}
        </span>
        <Button size="sm" variant="outline" disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)}>Prev</Button>
        <span className="tabular-nums">{props.page} / {props.pageCount}</span>
        <Button size="sm" variant="outline" disabled={props.page >= props.pageCount} onClick={() => props.onPage(props.page + 1)}>Next</Button>
      </div>
    </div>
  );
}
