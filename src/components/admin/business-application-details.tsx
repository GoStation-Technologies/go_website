import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { ApplicationDocument, applicationSections, type ApplicationKind } from "@/lib/application-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function BusinessApplicationDetails({ row, kind }: { row: Record<string, unknown>; kind: ApplicationKind }) {
  const { i18n, t } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const details = row.application_details && typeof row.application_details === "object" ? row.application_details as Record<string, unknown> : row;
  const documents = ApplicationDocument.array().safeParse(details.documents ?? []);
  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("application-documents").createSignedUrl(path, 300, { download: true });
    if (error || !data?.signedUrl) { toast.error(t("common.error")); return; }
    const link = document.createElement("a"); link.href = data.signedUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; link.click();
  };
  return <div className="space-y-4">
    {applicationSections[kind].map(section => <div key={section.en}><h3 className="mb-2 font-semibold text-foreground">{ar ? section.ar : section.en}</h3>
      <dl className="grid gap-2">{section.fields.map(field => {
        const value = details[field.key];
        const display = field.key === "acquisition_type" && value ? (value === "land" ? (ar ? "أرض" : "Land") : (ar ? "محطات وقود" : "Fuel Stations")) : value;
        return <div key={field.key} className="break-words"><dt className="font-medium">{ar ? field.ar : field.en}</dt><dd>{display == null || display === "" ? "—" : String(display)}</dd></div>;
      })}</dl>
    </div>)}
    <div><h3 className="font-semibold text-foreground">{ar ? "الرسالة" : "Message"}</h3><p className="whitespace-pre-wrap break-words">{String(details.notes ?? row.notes ?? "—")}</p></div>
    <div><h3 className="mb-2 font-semibold text-foreground">{ar ? "المستندات" : "Documents"}</h3>
      {documents.success && documents.data.length ? documents.data.map(doc => <Button key={doc.path} size="sm" variant="link" className="h-auto max-w-full gap-2 whitespace-normal p-0 text-start" onClick={() => download(doc.path)}><FileText className="h-4 w-4 shrink-0" /><span className="break-all">{doc.name}</span></Button>) : "—"}
    </div>
  </div>;
}