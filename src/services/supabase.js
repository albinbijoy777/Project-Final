import { createClient } from "@supabase/supabase-js";

function getAuthStorage() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.sessionStorage;
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: getAuthStorage(),
      detectSessionInUrl: true,
    },
  }
);
