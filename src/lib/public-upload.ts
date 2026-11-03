import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a visitor's file straight from the browser to private storage, so
 * large attachments never travel through the server request body (which
 * reverse proxies often cap at 1 MB).
 */
export async function uploadPublicFile(bucket: "cvs" | "leasing-documents", path: string, file: File) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) {
    console.error(`[upload] ${bucket} upload failed`, error);
    throw new Error("upload_failed");
  }
  return path;
}
