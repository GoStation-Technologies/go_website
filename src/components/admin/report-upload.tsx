import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function ReportUpload({ onChange }: { onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  async function upload(file: File) {
    setBusy(true);
    try {
      const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
      if (signature !== "%PDF-" || file.size > 20_000_000) throw new Error(ar ? "يرجى اختيار ملف PDF لا يتجاوز 20 ميجابايت." : "Choose a PDF no larger than 20 MB.");
      const path = `reports/${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage.from("cms").upload(path, file, { contentType: "application/pdf", upsert: false });
      if (error) throw error;
      onChange(`/api/public/media/${path}`);
      toast.success(ar ? "تم رفع التقرير" : "Report uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ar ? "تعذر رفع التقرير" : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return <>
    <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload className="me-2 h-4 w-4" />{busy ? (ar ? "جارٍ الرفع…" : "Uploading…") : (ar ? "رفع ملف PDF" : "Upload PDF")}</Button>
    <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
  </>;
}