import { z } from "zod";

export const ChatsInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  sort: z.enum(["newest", "oldest", "messages"]).default("newest"),
});
export type AdminListChatsInput = z.infer<typeof ChatsInput>;

/** Pure pagination math used by adminListChats. Exported for unit tests. */
export function paginateSessions<T>(all: T[], page: number, pageSize: number) {
  const total = all.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    sessions: all.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}
