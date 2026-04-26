import { supabase } from "./supabase.js";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

function slugifyServiceName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uploadServiceImage(serviceName, file) {
  if (!serviceName || !file) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${slugifyServiceName(serviceName) || "service"}/cover-${Date.now()}.${extension}`;

  try {
    const { error } = await supabase.storage.from("service-media").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("service-media").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (_error) {
    return readFileAsDataUrl(file);
  }
}
