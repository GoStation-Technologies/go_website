import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inputCls } from "@/components/admin/form-kit";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Uploads an image / PDF to the private `cms` storage bucket and hands back a
 * long-lived signed URL that can be stored on a CMS record.
 */
export function MediaUpload({
  value,
  onChange,
  folder = "cms",
  accept = "image/*",
}: {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("cms").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage
        .from("cms")
        .createSignedUrl(path, TEN_YEARS);
      if (signErr || !data?.signedUrl) throw signErr ?? new Error("sign failed");
      onChange(data.signedUrl);
      toast.success(t("admin.cms.uploaded", { defaultValue: "File uploaded" }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className={inputCls}
          dir="ltr"
        />
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
        </Button>
        {value ? (
          <Button type="button" variant="ghost" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      {value && accept.startsWith("image") ? (
        <img src={value} alt="" className="h-24 w-auto rounded-md border object-cover" />
      ) : null}
    </div>
  );
}
