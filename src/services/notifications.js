import { supabase } from "./supabase";

export async function sendNotification(userId, title, message, type = "info") {
  return supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });
}
