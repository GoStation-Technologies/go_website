import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminListStations, adminUpsertStation, adminDeleteStation } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useListView, ListToolbar, validateListViewSearch } from "@/components/admin/list-toolbar";

export const Route = createFileRoute("/admin/stations")({
  component: StationsPage,
  validateSearch: (s: Record<string, unknown>) => validateListViewSearch(s),
});

type Station = {
  id?: string; name_ar: string; name_en: string; city_ar: string; city_en: string;
  district_ar?: string | null; district_en?: string | null;
  address_ar?: string | null; address_en?: string | null;
  lat: number; lng: number; is_24h: boolean; is_active: boolean;
  fuel_types: string[]; services: string[]; photo_url?: string | null;
};

const empty: Station = {
  name_ar: "", name_en: "", city_ar: "", city_en: "",
  district_ar: "", district_en: "", address_ar: "", address_en: "",
  lat: 24.7136, lng: 46.6753, is_24h: false, is_active: true,
  fuel_types: [], services: [], photo_url: "",
};

function StationsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Station>(empty);

  const { data, isFetching } = useQuery({
    queryKey: ["admin", "stations"],
    queryFn: () => adminListStations(),
  });

  const upsert = useMutation({
    mutationFn: (s: Station) => adminUpsertStation({ data: s }),
    onSuccess: () => { toast.success(t("admin.common.saved")); setOpen(false); qc.invalidateQueries({ queryKey: ["admin", "stations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteStation({ data: { id } }),
    onSuccess: () => { toast.success(t("admin.common.deleted")); qc.invalidateQueries({ queryKey: ["admin", "stations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data?.rows ?? []) as Station[];
  const view = useListView<Station>({
    rows,
    search: (s) => `${s.name_en} ${s.name_ar} ${s.city_en} ${s.city_ar} ${s.district_en ?? ""} ${s.district_ar ?? ""}`,
    sort: {
      newest: () => 0,
      name_en: (a, b) => a.name_en.localeCompare(b.name_en),
      city_en: (a, b) => a.city_en.localeCompare(b.city_en),
      active_first: (a, b) => Number(b.is_active) - Number(a.is_active),
    },
    defaultSort: "newest",
  });

  const edit = (s: Station) => { setForm({ ...empty, ...s }); setOpen(true); };
  const create = () => { setForm(empty); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.stations.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={create}><Plus className="me-1 h-4 w-4" />{t("admin.stations.new")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{form.id ? t("admin.stations.editTitle") : t("admin.stations.newTitle")}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("admin.stations.f.nameEn")}><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></Field>
              <Field label={t("admin.stations.f.nameAr")}><Input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></Field>
              <Field label={t("admin.stations.f.cityEn")}><Input value={form.city_en} onChange={(e) => setForm({ ...form, city_en: e.target.value })} /></Field>
              <Field label={t("admin.stations.f.cityAr")}><Input dir="rtl" value={form.city_ar} onChange={(e) => setForm({ ...form, city_ar: e.target.value })} /></Field>
              <Field label={t("admin.stations.f.districtEn")}><Input value={form.district_en ?? ""} onChange={(e) => setForm({ ...form, district_en: e.target.value })} /></Field>
              <Field label={t("admin.stations.f.districtAr")}><Input dir="rtl" value={form.district_ar ?? ""} onChange={(e) => setForm({ ...form, district_ar: e.target.value })} /></Field>
              <Field label={t("admin.stations.f.addressEn")}><Input value={form.address_en ?? ""} onChange={(e) => setForm({ ...form, address_en: e.target.value })} /></Field>
              <Field label={t("admin.stations.f.addressAr")}><Input dir="rtl" value={form.address_ar ?? ""} onChange={(e) => setForm({ ...form, address_ar: e.target.value })} /></Field>
              <Field label={t("admin.stations.f.lat")}><Input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} /></Field>
              <Field label={t("admin.stations.f.lng")}><Input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} /></Field>
              <Field label={t("admin.stations.f.fuelTypes")}><Input value={form.fuel_types.join(",")} onChange={(e) => setForm({ ...form, fuel_types: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <Field label={t("admin.stations.f.services")}><Input value={form.services.join(",")} onChange={(e) => setForm({ ...form, services: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <Field label={t("admin.stations.f.photoUrl")}><Input value={form.photo_url ?? ""} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /></Field>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_24h} onCheckedChange={(v) => setForm({ ...form, is_24h: v })} />{t("admin.stations.f.open24")}</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />{t("admin.common.active")}</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>{t("admin.common.cancel")}</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>{t("admin.common.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ListToolbar
        q={view.q} onQ={view.setQ}
        sort={view.sort} onSort={view.setSort}
        sortOptions={[
          { value: "newest", label: t("admin.common.newest") },
          { value: "name_en", label: t("admin.common.nameAz") },
          { value: "city_en", label: t("admin.common.cityAz") },
          { value: "active_first", label: t("admin.common.activeFirst") },
        ]}
        pageSize={view.pageSize} onPageSize={view.setPageSize}
        page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage}
        searchPlaceholder={t("admin.stations.searchPlaceholder")}
      />

      <div className="overflow-x-auto rounded-lg border bg-background">
        {isFetching && !rows.length ? <p className="p-6 text-sm text-muted-foreground">{t("admin.common.loading")}</p> :
         view.pageRows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">{t("admin.stations.empty")}</p> : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2 text-start">{t("admin.common.name")}</th><th className="px-3 py-2 text-start">{t("admin.common.city")}</th><th className="px-3 py-2 text-start">{t("admin.common.coords")}</th><th className="px-3 py-2 text-start">{t("admin.common.status")}</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {view.pageRows.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2"><div className="font-medium">{s.name_en}</div><div className="text-xs text-muted-foreground" dir="rtl">{s.name_ar}</div></td>
                  <td className="px-3 py-2">{s.city_en}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</td>
                  <td className="px-3 py-2 text-xs">{s.is_active ? t("admin.common.active") : t("admin.common.inactive")}{s.is_24h ? ` · ${t("admin.stations.f.open24")}` : ""}</td>
                  <td className="px-3 py-2 text-end">
                    <Button size="sm" variant="ghost" onClick={() => edit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("admin.stations.confirmDelete")) && s.id) del.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
