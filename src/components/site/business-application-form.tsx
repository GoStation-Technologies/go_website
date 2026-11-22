import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, FileText, Upload, X, Loader2 } from "lucide-react";
import { applicationSections, APPLICATION_DOCUMENT_LIMIT, documentFileError, type ApplicationKind } from "@/lib/application-form";
import { FranchiseInput, AcquisitionInput } from "@/lib/submission-schemas";
import { submitFranchiseApplication, submitAcquisitionRequest } from "@/lib/submissions.functions";
import { uploadPublicFile } from "@/lib/public-upload";
import { useFormErrors } from "@/hooks/use-form-errors";
import { FieldError, invalidProps } from "./field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function BusinessApplicationForm({ kind }: { kind: ApplicationKind }) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const [form, setForm] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<{ file: File; path?: string }[]>([]);
  const [fileError, setFileError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const { errors, validate, fail } = useFormErrors();
  const franchiseSubmit = useServerFn(submitFranchiseApplication);
  const acquisitionSubmit = useServerFn(submitAcquisitionRequest);
  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const addFiles = (incoming: FileList | File[]) => {
    const next = [...files, ...Array.from(incoming).map(file => ({ file }))];
    if (next.length > APPLICATION_DOCUMENT_LIMIT) {
      setFileError(text("يمكن رفع 5 ملفات كحد أقصى.", "You can upload up to 5 files.")); return;
    }
    const problem = next.map(item => documentFileError(item.file)).find(Boolean);
    if (problem) {
      setFileError(problem === "type" ? text("يُسمح فقط بملفات PDF وDOCX وJPG وPNG.", "Only PDF, DOCX, JPG and PNG files are accepted.") : text("حجم الملف يتجاوز الحد المسموح به (20 ميجابايت)", "File size exceeds the allowed limit (20 MB)")); return;
    }
    setFileError(""); setFiles(next);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const data = validate(kind === "franchise" ? FranchiseInput : AcquisitionInput, {
      ...Object.fromEntries(applicationSections[kind].flatMap(section => section.fields.map(field => [field.key, form[field.key] ?? ""]))),
      notes: form.notes ?? "", documents: [],
    });
    if (!data) { requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${kind}-application [aria-invalid="true"]`)?.focus()); return; }
    setBusy(true);
    try {
      const documents = [];
      for (let index = 0; index < files.length; index++) {
        const item = files[index];
        const extension = (item.file.name.split(".").pop() ?? "").toLowerCase().replace("jpeg", "jpg");
        const path = item.path ?? `${kind}/${crypto.randomUUID()}.${extension}`;
        if (!item.path) {
          await uploadPublicFile("application-documents", path, item.file);
          setFiles(prev => prev.map((entry, i) => i === index ? { ...entry, path } : entry));
        }
        documents.push({ name: item.file.name, path });
      }
      const result = kind === "franchise"
        ? await franchiseSubmit({ data: FranchiseInput.parse({ ...data, documents }) })
        : await acquisitionSubmit({ data: AcquisitionInput.parse({ ...data, documents }) });
      setReference(result.reference); setForm({}); setFiles([]);
      toast.success(text("تم إرسال طلبك بنجاح.", "Your application was submitted successfully."));
    } catch (error) { fail(error, kind); } finally { setBusy(false); }
  };
  if (reference) return <div role="status" className="py-10 text-center">
    <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
    <h2 className="mt-4 text-2xl font-bold">{text("تم إرسال طلبك بنجاح", "Application submitted successfully")}</h2>
    <p className="mt-2 text-muted-foreground">{t("common.referenceSaved")} <span className="font-mono">{reference}</span></p>
  </div>;
  return <form id={`${kind}-application`} noValidate onSubmit={submit} dir={ar ? "rtl" : "ltr"} className="space-y-8 text-start">
    {applicationSections[kind].map(section => <section key={section.en}>
      <h3 className="mb-4 border-b pb-3 text-lg font-semibold">{text(section.ar, section.en)}</h3>
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        {section.fields.map(field => {
          const id = `${kind}-${field.key}`;
          const label = text(field.ar, field.en);
          return <div key={field.key} className="grid content-start gap-2">
            <Label htmlFor={id}>{label}{field.required && <span className="text-destructive" aria-hidden> *</span>}</Label>
            {field.type === "acquisition" ? <Select value={form[field.key] ?? ""} onValueChange={value => update(field.key, value)} disabled={busy}>
              <SelectTrigger id={id} className="w-full" {...invalidProps(id, errors[field.key])}><SelectValue placeholder={text("اختر نوع الاستحواذ", "Select acquisition type")} /></SelectTrigger>
              <SelectContent><SelectItem value="fuel_stations">{text("محطات وقود", "Fuel Stations")}</SelectItem><SelectItem value="land">{text("أرض", "Land")}</SelectItem></SelectContent>
            </Select> : <Input id={id} name={field.key} disabled={busy} required={field.required} value={form[field.key] ?? ""}
              onChange={event => update(field.key, event.target.value)} type={field.type === "tel" ? "tel" : field.type === "number" ? "number" : "text"}
              min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? field.key === "station_count" ? 1 : "0.01" : undefined}
              inputMode={field.type === "number" ? "decimal" : field.type === "tel" ? "tel" : "text"}
              dir={field.type === "tel" || field.type === "number" ? "ltr" : undefined}
              placeholder={field.type === "tel" ? "05xxxxxxxx" : label} maxLength={field.type === "tel" ? 10 : field.max ?? 200}
              {...invalidProps(id, errors[field.key])} />}
            {errors[field.key] && (field.type === "tel" || field.type === "acquisition") ? <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{field.type === "tel" ? text("يرجى إدخال رقم جوال بصيغة 05xxxxxxxx.", "Please enter a mobile number in the format 05xxxxxxxx.") : text("يرجى اختيار نوع الاستحواذ.", "Please select an acquisition type.")}</p> : <FieldError id={id} code={errors[field.key]} />}
          </div>;
        })}
      </div>
    </section>)}
    <section className="space-y-5">
      <h3 className="border-b pb-3 text-lg font-semibold">{text("معلومات عامة", "General Information")}</h3>
      <div className="grid gap-2"><Label htmlFor={`${kind}-notes`}>{text("الرسالة", "Message")}</Label>
        <Textarea id={`${kind}-notes`} placeholder={text("اكتب رسالتك", "Enter your message")} disabled={busy} rows={5} maxLength={4000} value={form.notes ?? ""} onChange={event => update("notes", event.target.value)} {...invalidProps(`${kind}-notes`, errors.notes)} />
        <FieldError id={`${kind}-notes`} code={errors.notes} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${kind}-documents`}>{text("رفع المستندات", "Upload Documents")}</Label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 p-6 text-center hover:border-accent"
          onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy) addFiles(event.dataTransfer.files); }}>
          <Upload className="h-6 w-6 text-accent" />
          <span className="text-sm font-medium">{text("اختر الملفات أو اسحبها هنا", "Choose files or drop them here")}</span>
          <span className="text-xs text-muted-foreground">{text("PDF، DOCX، JPG، PNG — حتى 5 ملفات، 20 ميجابايت لكل ملف", "PDF, DOCX, JPG, PNG — up to 5 files, 20 MB each")}</span>
          <input id={`${kind}-documents`} type="file" multiple disabled={busy} className="sr-only" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
        </label>
        {fileError && <p role="alert" className="text-sm text-destructive">{fileError}</p>}
        {files.map((item, index) => <div key={`${item.file.name}-${index}`} className="flex min-w-0 items-center gap-2 rounded-md border px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-accent" /><span className="min-w-0 flex-1 break-all text-sm">{item.file.name}</span>
          <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={text("إزالة الملف", "Remove file")} onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}><X className="h-4 w-4" /></Button>
        </div>)}
      </div>
    </section>
    <div className="flex justify-end"><Button type="submit" disabled={busy} className="min-w-40 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? t("common.submitting") : text("إرسال الطلب", "Submit Application")}
    </Button></div>
  </form>;
}