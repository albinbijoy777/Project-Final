// src/services/auth.js
import { supabase } from "./supabase.js";
import { normalizeRole } from "../utils/roles.js";
import { assertApprovedEmail, normalizeEmail } from "../utils/email.js";

function getPasswordResetRedirect() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/reset-password`;
}

function profilePayload(user, details = {}) {
  return {
    id: user.id,
    email: normalizeEmail(details.email || user.email),
    name: details.name || user.user_metadata?.name || user.email?.split("@")[0] || "FixBee Member",
    role: normalizeRole(details.role || user.user_metadata?.role || "user"),
    phone: details.phone || "",
    address: details.address || "",
    avatar: details.avatar || details.avatar_url || null,
    avatar_url: details.avatar_url || details.avatar || null,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertProfile(profile) {
  const nextProfile = {
    ...profile,
    ...(profile.email ? { email: assertApprovedEmail(profile.email) } : {}),
    ...(profile.role ? { role: normalizeRole(profile.role) } : {}),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(nextProfile, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateExistingProfile(profile) {
  if (!profile?.id) {
    throw new Error("Profile id is required.");
  }

  const nextProfile = {
    ...profile,
    ...(profile.email ? { email: assertApprovedEmail(profile.email) } : {}),
    ...(profile.role ? { role: normalizeRole(profile.role) } : {}),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(nextProfile)
    .eq("id", profile.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function login(email, password) {
  const normalizedEmail = assertApprovedEmail(email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signUp({ email, password, name, role, phone, address }) {
  const normalizedEmail = assertApprovedEmail(email);
  const nextRole = normalizeRole(role);
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name, role: nextRole },
    },
  });

  if (error) throw new Error(error.message);
  if (data?.user && data?.session) {
    await upsertProfile(
      profilePayload(data.user, {
        email: normalizedEmail,
        name,
        role: nextRole,
        phone,
        address,
      })
    );
  }
  return data;
}

export async function sendPasswordResetEmail(email) {
  const normalizedEmail = assertApprovedEmail(email);
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: getPasswordResetRedirect(),
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error("Use a password with at least 8 characters.");
  }

  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error && !/auth session missing/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function ensureProfile(user) {
  if (!user) return null;

  try {
    return await getProfile(user.id);
  } catch {
    return upsertProfile(profilePayload(user));
  }
}
