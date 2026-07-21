import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminListJobs, adminUpsertJob, adminDeleteJob } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useListView, ListToolbar } from "@/components/admin/list-toolbar";

export const Route = createFileRoute("/admin/careers")({ component: CareersPage });

type Job = {
  id?: string; slug: string; title_ar: string; title_en: string;
  department: string; city: string; employment_type: string;
  description_ar?: string | null; description_en?: string | null; is_active: boolean;
};

const empty: Job = {
  slug: "", title_ar: "", title_en: "",
  department: "", city: "", employment_type: "full_time",
  description_ar: "", description_en: "", is_active: true,
};

function CareersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Job>(empty);

  const { data, isFetching } = useQuery({ queryKey: ["admin", "jobs"], queryFn: () => adminListJobs() });
  const upsert = useMutation({
    mutationFn: (j: Job) => adminUpsertJob({ data: j }),
    onSuccess: () => { toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin", "jobs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteJob({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "jobs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data?.rows ?? []) as Job[];
  const view = useListView<Job>({
    rows,
    search: (j) => `${j.title_en} ${j.title_ar} ${j.slug} ${j.department} ${j.city} ${j.employment_type}`,
    sort: {
      newest: () => 0,
      title_en: (a, b) => a.title_en.localeCompare(b.title_en),
      department: (a, b) => a.department.localeCompare(b.department),
      city: (a, b) => a.city.localeCompare(b.city),
      active_first: (a, b) => Number(b.is_active) - Number(a.is_active),
    },
    defaultSort: "newest",
  });
  const edit = (j: Job) => { setForm({ ...empty, ...j }); setOpen(true); };
  const create = () => { setForm(empty); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Careers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={create}><Plus className="me-1 h-4 w-4" />New opening</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit job" : "New job"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
              <Field label="Employment type">
                <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="full_time">Full-time</option><option value="part_time">Part-time</option>
                  <option value="contract">Contract</option><option value="internship">Internship</option>
                </select>
              </Field>
              <Field label="Title (EN)"><Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} /></Field>
              <Field label="Title (AR)"><Input dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></Field>
              <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
              <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
              <Field label="Description (EN)"><Textarea rows={5} value={form.description_en ?? ""} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></Field>
              <Field label="Description (AR)"><Textarea dir="rtl" rows={5} value={form.description_ar ?? ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} /></Field>
              <div className="col-span-2 pt-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />Active (visible on careers page)</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ListToolbar
        q={view.q} onQ={view.setQ}
        sort={view.sort} onSort={view.setSort}
        sortOptions={[
          { value: "newest", label: "Newest" },
          { value: "title_en", label: "Title A→Z" },
          { value: "department", label: "Department" },
          { value: "city", label: "City" },
          { value: "active_first", label: "Active first" },
        ]}
        pageSize={view.pageSize} onPageSize={view.setPageSize}
        page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage}
        searchPlaceholder="Search title, dept, city…"
      />

      <div className="overflow-x-auto rounded-lg border bg-background">
        {isFetching && !rows.length ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> :
         view.pageRows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No openings.</p> : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2 text-start">Title</th><th className="px-3 py-2 text-start">Dept</th><th className="px-3 py-2 text-start">City</th><th className="px-3 py-2 text-start">Type</th><th className="px-3 py-2 text-start">Status</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {view.pageRows.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="px-3 py-2"><div className="font-medium">{j.title_en}</div><div className="text-xs text-muted-foreground" dir="rtl">{j.title_ar}</div></td>
                  <td className="px-3 py-2 text-xs">{j.department}</td>
                  <td className="px-3 py-2 text-xs">{j.city}</td>
                  <td className="px-3 py-2 text-xs">{j.employment_type}</td>
                  <td className="px-3 py-2 text-xs">{j.is_active ? "Active" : "Closed"}</td>
                  <td className="px-3 py-2 text-end">
                    <Button size="sm" variant="ghost" onClick={() => edit(j)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete opening?") && j.id) del.mutate(j.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
