// src/services/auth.js
import { supabase } from "./supabase.js";
import { normalizeRole } from "../utils/roles.js";
import { assertApprovedEmail, normalizeEmail } from "../utils/email.js";
import { normalizeLocationSelection } from "../utils/location.js";
import { normalizeProfileRecord, normalizeWorkerApplicationStatus } from "../utils/profile.js";

const WORKER_PROFILE_KEYS = [
  "worker_application_status",
  "workerApplicationStatus",
  "worker_application_note",
  "workerApplicationNote",
  "worker_application_submitted_at",
  "workerApplicationSubmittedAt",
  "worker_reviewed_at",
  "workerReviewedAt",
  "worker_service_state",
  "workerServiceState",
  "worker_service_district",
  "workerServiceDistrict",
  "worker_service_districts",
  "workerServiceDistricts",
  "worker_service_location",
  "workerServiceLocation",
  "worker_service_place_id",
  "workerServicePlaceId",
  "worker_service_latitude",
  "workerServiceLatitude",
  "worker_service_longitude",
  "workerServiceLongitude",
  "is_accepting_jobs",
  "isAcceptingJobs",
];

function hasOwn(details, key) {
  return Object.prototype.hasOwnProperty.call(details, key);
}

function getInputValue(details, ...keys) {
  for (const key of keys) {
    if (hasOwn(details, key) && details[key] !== undefined) {
      return details[key];
    }
  }

  return undefined;
}

function hasWorkerProfileInput(details = {}) {
  return WORKER_PROFILE_KEYS.some((key) => hasOwn(details, key));
}

function buildWorkerProfileFields(details = {}, { persistedRole, requestedRole } = {}) {
  const normalizedPersistedRole = normalizeRole(persistedRole || getInputValue(details, "role") || "user");
  const normalizedRequestedRole = normalizeRole(
    requestedRole ||
      getInputValue(details, "requested_role", "requestedRole", "role") ||
      normalizedPersistedRole
  );
  const shouldIncludeWorkerFields =
    normalizedRequestedRole === "worker" || hasWorkerProfileInput(details);

  if (!shouldIncludeWorkerFields) {
    return {};
  }

  const location = normalizeLocationSelection({
    state: getInputValue(details, "worker_service_state", "workerServiceState"),
    district: getInputValue(details, "worker_service_district", "workerServiceDistrict"),
    districts: getInputValue(details, "worker_service_districts", "workerServiceDistricts"),
    locationText: getInputValue(details, "worker_service_location", "workerServiceLocation"),
    placeId: getInputValue(details, "worker_service_place_id", "workerServicePlaceId"),
    latitude: getInputValue(details, "worker_service_latitude", "workerServiceLatitude"),
    longitude: getInputValue(details, "worker_service_longitude", "workerServiceLongitude"),
  });

  const nextWorkerStatus = getInputValue(details, "worker_application_status", "workerApplicationStatus");
  const payload = {
    worker_application_status: normalizeWorkerApplicationStatus(
      nextWorkerStatus || (normalizedPersistedRole === "worker" ? "approved" : normalizedRequestedRole === "worker" ? "pending" : "not_requested"),
      normalizedPersistedRole
    ),
    worker_application_note: getInputValue(details, "worker_application_note", "workerApplicationNote") || "",
    worker_service_state: location.state,
    worker_service_districts: location.districts,
    worker_service_location: location.locationText,
    worker_service_place_id: location.placeId,
    worker_service_latitude: location.latitude || null,
    worker_service_longitude: location.longitude || null,
    is_accepting_jobs:
      getInputValue(details, "is_accepting_jobs", "isAcceptingJobs") ??
      normalizedPersistedRole === "worker",
  };

  const submittedAt = getInputValue(details, "worker_application_submitted_at", "workerApplicationSubmittedAt");
  const reviewedAt = getInputValue(details, "worker_reviewed_at", "workerReviewedAt");

  if (submittedAt !== undefined) {
    payload.worker_application_submitted_at = submittedAt;
  } else if (normalizedRequestedRole === "worker" && normalizedPersistedRole !== "worker") {
    payload.worker_application_submitted_at = new Date().toISOString();
  }

  if (reviewedAt !== undefined) {
    payload.worker_reviewed_at = reviewedAt;
  }

  return payload;
}

function profilePayload(user, details = {}) {
  const requestedRole = normalizeRole(details.role || user.user_metadata?.requested_role || user.user_metadata?.role || "user");
  const persistedRole = normalizeRole(details.persistedRole || user.user_metadata?.role || (requestedRole === "worker" ? "user" : requestedRole));

  return {
    id: user.id,
    email: normalizeEmail(details.email || user.email),
    name: details.name || user.user_metadata?.name || user.email?.split("@")[0] || "FixBee Member",
    role: persistedRole,
    phone: details.phone || "",
    address: details.address || "",
    avatar: details.avatar || details.avatar_url || null,
    avatar_url: details.avatar_url || details.avatar || null,
    ...buildWorkerProfileFields(details, { persistedRole, requestedRole }),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertProfile(profile) {
  const normalizedRole = profile.role ? normalizeRole(profile.role) : "user";
  const nextProfile = {
    id: profile.id,
    email: profile.email ? assertApprovedEmail(profile.email) : undefined,
    name: profile.name,
    role: normalizedRole,
    phone: profile.phone,
    address: profile.address,
    avatar: profile.avatar ?? null,
    avatar_url: profile.avatar_url ?? profile.avatar ?? null,
    ...buildWorkerProfileFields(profile, {
      persistedRole: normalizedRole,
      requestedRole: profile.requested_role || profile.requestedRole || profile.role,
    }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(nextProfile, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return normalizeProfileRecord(data);
}

export async function updateExistingProfile(profile) {
  if (!profile?.id) {
    throw new Error("Profile id is required.");
  }

  const normalizedRole = profile.role ? normalizeRole(profile.role) : "user";
  const nextProfile = {
    ...(profile.email ? { email: assertApprovedEmail(profile.email) } : {}),
    ...(profile.name !== undefined ? { name: profile.name } : {}),
    ...(profile.role ? { role: normalizedRole } : {}),
    ...(profile.phone !== undefined ? { phone: profile.phone } : {}),
    ...(profile.address !== undefined ? { address: profile.address } : {}),
    ...(profile.avatar !== undefined ? { avatar: profile.avatar ?? null } : {}),
    ...(profile.avatar_url !== undefined ? { avatar_url: profile.avatar_url ?? profile.avatar ?? null } : {}),
    ...buildWorkerProfileFields(profile, {
      persistedRole: normalizedRole,
      requestedRole: profile.requested_role || profile.requestedRole || profile.role,
    }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(nextProfile)
    .eq("id", profile.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return normalizeProfileRecord(data);
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

export async function signUp(details) {
  const { email, password, name, role, phone, address } = details;
  const normalizedEmail = assertApprovedEmail(email);
  const requestedRole = normalizeRole(role);
  const persistedRole = requestedRole === "worker" ? "user" : requestedRole;
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name, role: persistedRole, requested_role: requestedRole },
    },
  });

  if (error) throw new Error(error.message);
  if (data?.user && data?.session) {
    await upsertProfile(
      profilePayload(data.user, {
        email: normalizedEmail,
        name,
        role: requestedRole,
        persistedRole,
        phone,
        address,
        ...details,
      })
    );
  }
  return data;
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
  return normalizeProfileRecord(data);
}

export async function ensureProfile(user) {
  if (!user) return null;

  try {
    return await getProfile(user.id);
  } catch {
    return upsertProfile(profilePayload(user));
  }
}
