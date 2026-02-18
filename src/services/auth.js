import { supabase } from "./supabase";

export async function getProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Profile fetch error:", error.message);
    throw error;
  }

  return data;
}
