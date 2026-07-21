import { z } from "zod";

export const ChatsInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  sort: z.enum(["newest", "oldest", "messages"]).default("newest"),
});
export type AdminListChatsInput = z.infer<typeof ChatsInput>;

/**
 * Parse pagination input or throw a Response(400) with a structured error body:
 *   { error: "invalid_input", message, fields: string[], fieldErrors: Record<string,string[]> }
 * Exported so unit tests can assert the exact wire shape without a network hop.
 */
export function validateChatsInput(raw: unknown): AdminListChatsInput {
  const parsed = ChatsInput.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_root";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  throw new Response(
    JSON.stringify({
      error: "invalid_input",
      message: "One or more pagination parameters are invalid.",
      fields: Object.keys(fieldErrors),
      fieldErrors,
    }),
    { status: 400, headers: { "content-type": "application/json" } },
  );
}


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
