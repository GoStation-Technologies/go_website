import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inputCls } from "@/components/admin/form-kit";


/**
 * Uploads an image / video / PDF to the `cms` storage bucket and hands back a
 * permanent public URL (served by /api/public/media) to store on the record.
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
      if (file.size > 100 * 1024 * 1024) throw new Error("Max 100MB");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("cms").upload(path, file, { upsert: false });
      if (error) throw error;
      // Permanent public address served by /api/public/media (never a blob: or expiring link).
      onChange(`${window.location.origin}/api/public/media/${path}`);
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
      {value && accept.startsWith("image") ? (
        <img src={value} alt="" className="h-24 w-auto rounded-md border object-contain" />
      ) : null}
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
    </div>
  );
}
