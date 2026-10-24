import { useTranslation } from "react-i18next";
import { leasingMetadata } from "@/lib/leasing-request";
import { cityLabel } from "@/lib/cities";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";

export function LeasingRequestDetails({ row }: { row: Record<string, unknown> }) {
  const { t, i18n } = useTranslation();
  const metadata = leasingMetadata(row);
  const fields = [
    [t("lease.f.company"), metadata.company], [t("lease.f.activity"), metadata.activity],
    [t("common.city"), cityLabel(metadata.city, i18n.language)], [t("lease.f.district"), metadata.district],
    [t("lease.f.area"), metadata.area_sqm], [t("lease.f.duration"), metadata.lease_years],
  ];
  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("leasing-documents").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) { toast.error(t("common.error")); return; }
    const link = document.createElement("a");
    link.href = data.signedUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; link.click();
  };
  return <div className="space-y-3">
    <dl className="grid gap-2">
      {fields.map(([label, value]) => <div key={String(label)} className="break-words"><dt className="font-medium text-foreground">{label}</dt><dd>{value == null || value === "" ? "—" : String(value)}</dd></div>)}
    </dl>
    <div><p className="font-medium text-foreground">{t("lease.f.documents")}</p>
      {metadata.documents.length ? metadata.documents.map((doc) => <Button key={doc.path} variant="link" size="sm" className="h-auto max-w-full justify-start gap-2 whitespace-normal p-0 text-start" onClick={() => download(doc.path)}><FileText className="h-4 w-4 shrink-0" /><span className="break-all">{doc.name}</span></Button>) : <p>—</p>}
    </div>
    <p className="whitespace-pre-wrap break-words">{String(row.message ?? "")}</p>
  </div>;
}