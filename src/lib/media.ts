import { supabase } from "@/integrations/supabase/client";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFor(file: File) {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return byType[file.type] ?? "bin";
}

export async function uploadBiofyImage(
  userId: string,
  file: File,
  area: "avatar" | "background" | "block" = "block",
) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato não suportado. Use JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("A imagem deve ter no máximo 8 MB.");
  }

  const path = `${userId}/${area}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from("biofy-media").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("biofy-media").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
