import { supabase } from "./supabase.js";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export async function uploadAvatar(userId, file) {
  if (!userId || !file) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  try {
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (_error) {
    return readFileAsDataUrl(file);
  }
}

export async function updateProfileAvatar(userId, file) {
  const avatarUrl = await uploadAvatar(userId, file);
  return avatarUrl;
}
