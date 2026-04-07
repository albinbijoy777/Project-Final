import { supabase } from "./supabase.js";
import { findServiceBlueprint, SERVICE_BLUEPRINTS } from "../data/serviceCatalog.js";
import { appendTimeline, parseBookingMeta, serializeBookingMeta } from "../utils/bookingMeta.js";
import { normalizeRole } from "../utils/roles.js";

function slugifyServiceName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createServiceSeedRecord(service) {
  return {
    slug: service.slug,
    name: service.name,
    category: service.category,
    description: service.description,
    price: service.startingPrice,
    rating: service.rating,
    reviews_count: service.reviewsCount,
    active: true,
  };
}

function buildFallbackServices() {
  return SERVICE_BLUEPRINTS.map((service) =>
    normalizeService({
      id: service.slug,
      slug: service.slug,
      name: service.name,
      category: service.category,
      description: service.description,
      price: service.startingPrice,
      rating: service.rating,
      reviews_count: service.reviewsCount,
      active: true,
      created_at: new Date().toISOString(),
    })
  );
}

function normalizeService(record) {
  const blueprint = findServiceBlueprint(record?.slug || record?.name) || {};
  return {
    ...blueprint,
    ...record,
    slug: record?.slug || blueprint.slug || slugifyServiceName(record?.id || record?.name || "service"),
    name: record?.name || blueprint.name || "Service",
    category: record?.category || blueprint.category || "Home Services",
    description:
      record?.description ||
      blueprint.description ||
      "Trusted professionals, live scheduling, transparent pricing, and real-time progress tracking.",
    price: Number(record?.price ?? blueprint.startingPrice ?? 0),
    rating: Number(record?.rating ?? blueprint.rating ?? 4.8),
    reviewsCount: Number(record?.reviews_count ?? blueprint.reviewsCount ?? 860),
    rewardCoins: blueprint.rewardCoins || 25,
    discountCode: blueprint.discountCode || "WELCOME10",
    locations: blueprint.locations || ["Bengaluru", "Mumbai", "Delhi NCR"],
    highlights: blueprint.highlights || ["Verified professionals", "Live booking updates", "Transparent invoicing"],
    includes: blueprint.includes || ["Expert visit", "Service diagnostics", "Completion summary"],
    howItWorks: blueprint.howItWorks || [
      "Choose your slot and share the exact requirement.",
      "Track assignment and status updates in real time.",
      "Get a clear invoice and service summary after completion.",
    ],
    faqs: blueprint.faqs || [],
    reviews: blueprint.reviews || [],
    duration: blueprint.duration || "60 min",
    coverImage: blueprint.coverImage,
    videoUrl: blueprint.videoUrl,
  };
}

function normalizeBooking(record) {
  const meta = parseBookingMeta(record?.notes);
  const blueprint = findServiceBlueprint(meta?.serviceSlug || record?.service);
  const rescheduleRequest = meta?.rescheduleRequest || null;

  return {
    ...record,
    meta,
    serviceName: record?.service || blueprint?.name || "Service",
    timeline: Array.isArray(meta?.timeline) ? meta.timeline : [],
    paymentMethod: meta?.paymentMethod || "cash",
    promoCode: meta?.promoCode || null,
    rewardCoinsRedeemed: Number(meta?.rewardCoinsRedeemed || 0),
    rewardCoinsEarned: Number(meta?.rewardCoinsEarned || blueprint?.rewardCoins || 0),
    requirementDetails: meta?.requirementDetails || meta?.details || "",
    urgency: meta?.urgency || "standard",
    location: meta?.location || record?.address || "",
    serviceSlug: meta?.serviceSlug || blueprint?.slug || null,
    rescheduleRequest,
    hasPendingReschedule: rescheduleRequest?.status === "pending",
  };
}

async function safeNotificationInsert(notification) {
  try {
    await supabase.from("notifications").insert([
      {
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        is_read: false,
      },
    ]);
  } catch (_error) {
    return null;
  }

  return true;
}

export async function ensureCoreServices() {
  const { data, error } = await supabase.from("services").select("id").limit(1);
  if (error) throw new Error(error.message);

  if (!data?.length) {
    const { error: seedError } = await supabase
      .from("services")
      .insert(SERVICE_BLUEPRINTS.map(createServiceSeedRecord));

    if (seedError) {
      return false;
    }
  }

  return true;
}

export async function listServices({ includeInactive = false } = {}) {
  try {
    const seeded = await ensureCoreServices();

    let query = supabase.from("services").select("*").order("created_at", { ascending: false });
    if (!includeInactive) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    if (!data?.length && !seeded) {
      return buildFallbackServices();
    }

    if (!data?.length) {
      return buildFallbackServices();
    }

    return data.map(normalizeService);
  } catch (_error) {
    return buildFallbackServices();
  }
}

export async function getServiceById(serviceId) {
  const serviceKey = String(serviceId || "").trim();

  if (!serviceKey) {
    throw new Error("Service not found.");
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .or(`id.eq.${serviceKey},slug.eq.${serviceKey}`)
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return normalizeService(data);
  }

  const blueprint = findServiceBlueprint(serviceKey);
  if (blueprint) {
    return normalizeService({
      id: blueprint.slug,
      slug: blueprint.slug,
      name: blueprint.name,
      category: blueprint.category,
      description: blueprint.description,
      price: blueprint.startingPrice,
      rating: blueprint.rating,
      reviews_count: blueprint.reviewsCount,
      active: true,
    });
  }

  throw new Error(error?.message || "Service not found.");
}

export async function saveService(service) {
  const payload = {
    slug: slugifyServiceName(service.name),
    name: service.name,
    category: service.category,
    description: service.description,
    price: Number(service.price || 0),
    active: Boolean(service.active),
    rating: Number(service.rating || 4.8),
    reviews_count: Number(service.reviewsCount || 0),
  };

  if (service.id) {
    const { data, error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", service.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalizeService(data);
  }

  const { data, error } = await supabase.from("services").insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return normalizeService(data);
}

export async function removeService(serviceId) {
  const { error } = await supabase.from("services").delete().eq("id", serviceId);
  if (error) throw new Error(error.message);
}

export async function listProfiles(role) {
  const { data, error } = await supabase.from("profiles").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);

  const normalizedProfiles = (data || []).map((profile) => ({
    ...profile,
    role: normalizeRole(profile.role),
  }));

  if (!role) {
    return normalizedProfiles;
  }

  return normalizedProfiles.filter((profile) => profile.role === normalizeRole(role));
}

export async function updateProfileRecord(userId, updates) {
  const nextRole = updates.role ? normalizeRole(updates.role) : undefined;
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        ...updates,
        ...(nextRole ? { role: nextRole } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createBooking({ userId, service, profile, form }) {
  const selectedService = typeof service === "string" ? findServiceBlueprint(service) : service;
  const rewardCoinsEarned = selectedService?.rewardCoins || 20;
  const basePrice = Number(selectedService?.price || selectedService?.startingPrice || 0);
  const discountValue = form.promoCode ? Math.round(basePrice * 0.1) : 0;
  const rewardRedeemed = Math.min(Number(form.rewardCoinsRedeemed || 0), 200);
  const finalPrice = Math.max(basePrice - discountValue - rewardRedeemed, 0);

  let meta = {
    serviceSlug: selectedService?.slug || null,
    requirementDetails: form.requirementDetails,
    urgency: form.urgency,
    paymentMethod: form.paymentMethod,
    promoCode: form.promoCode || null,
    rewardCoinsRedeemed: rewardRedeemed,
    rewardCoinsEarned,
    location: form.location,
    city: form.city,
    customerName: profile?.name || "",
    customerPhone: form.phone || profile?.phone || "",
  };

  meta = appendTimeline(meta, {
    actor: "system",
    status: "pending",
    title: "Booking created",
    note: "Your request has been received and is waiting for assignment.",
  });

  const payload = {
    user_id: userId,
    service: selectedService?.name || service?.name || "Service",
    service_date: form.date,
    service_time: form.time,
    address: form.location,
    status: "pending",
    price: finalPrice,
    notes: serializeBookingMeta(meta),
  };

  const { data, error } = await supabase.from("bookings").insert([payload]).select().single();
  if (error) throw new Error(error.message);

  await safeNotificationInsert({
    userId,
    title: "Booking confirmed",
    message: `${payload.service} has been scheduled for ${form.date} at ${form.time}.`,
    type: "success",
  });

  return normalizeBooking(data);
}

export async function listUserBookings(userId) {
  let response = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .eq("hidden_for_user", false)
    .order("service_date", { ascending: false });

  if (response.error && /hidden_for_user/i.test(response.error.message)) {
    response = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .order("service_date", { ascending: false });
  }

  if (response.error) throw new Error(response.error.message);
  return (response.data || []).map(normalizeBooking);
}

export async function listWorkerBookings(workerId) {
  let response = await supabase
    .from("bookings")
    .select("*")
    .eq("technician_id", workerId)
    .eq("hidden_for_worker", false)
    .order("service_date", { ascending: true });

  if (response.error && /hidden_for_worker/i.test(response.error.message)) {
    response = await supabase
      .from("bookings")
      .select("*")
      .eq("technician_id", workerId)
      .order("service_date", { ascending: true });
  }

  if (response.error) throw new Error(response.error.message);
  return (response.data || []).map(normalizeBooking);
}

export async function listAllBookings() {
  let response = await supabase
    .from("bookings")
    .select("*")
    .eq("hidden_for_admin", false)
    .order("service_date", { ascending: false });

  if (response.error && /hidden_for_admin/i.test(response.error.message)) {
    response = await supabase
      .from("bookings")
      .select("*")
      .order("service_date", { ascending: false });
  }

  if (response.error) throw new Error(response.error.message);
  return (response.data || []).map(normalizeBooking);
}

export async function getBookingById(bookingId) {
  const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (error) throw new Error(error.message);
  return normalizeBooking(data);
}

export async function updateBookingStatus(bookingId, status, actorLabel) {
  const current = await getBookingById(bookingId);
  const meta = appendTimeline(current.meta, {
    actor: actorLabel || "operator",
    status,
    title: `Status changed to ${status.replaceAll("_", " ")}`,
    note: `Updated by ${actorLabel || "the team"}.`,
  });

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status,
      notes: serializeBookingMeta(meta),
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (current.user_id) {
    await safeNotificationInsert({
      userId: current.user_id,
      title: `${current.serviceName} is now ${status.replaceAll("_", " ")}`,
      message: `The job status has been updated by ${actorLabel || "the team"}.`,
      type: status === "completed" ? "success" : "info",
    });
  }

  if (current.technician_id && current.technician_id !== current.user_id) {
    await safeNotificationInsert({
      userId: current.technician_id,
      title: `Job status updated: ${current.serviceName}`,
      message: `This assignment is now marked ${status.replaceAll("_", " ")}.`,
      type: "info",
    });
  }

  return normalizeBooking(data);
}

export async function cancelBookingForCurrentRole(bookingId, actorLabel, reason) {
  const { data, error } = await supabase.rpc("cancel_booking_for_current_role", {
    target_booking_id: bookingId,
    actor_label: actorLabel || null,
    cancellation_reason: reason || null,
  });

  if (error) {
    if (/cancel_booking_for_current_role|does not exist/i.test(error.message)) {
      throw new Error("Run fixbee_history_notifications_patch.sql in Supabase first.");
    }

    throw new Error(error.message);
  }

  const nextBooking = Array.isArray(data) ? data[0] : data;
  return normalizeBooking(nextBooking);
}

export async function requestBookingRescheduleForCurrentRole(bookingId, actorLabel, nextDate, nextTime, reason) {
  const { data, error } = await supabase.rpc("request_booking_reschedule_for_current_role", {
    target_booking_id: bookingId,
    requested_service_date: nextDate,
    requested_service_time: nextTime,
    actor_label: actorLabel || null,
    request_reason: reason || null,
  });

  if (error) {
    if (/request_booking_reschedule_for_current_role|does not exist/i.test(error.message)) {
      throw new Error("Run fixbee_history_notifications_patch.sql in Supabase first.");
    }

    throw new Error(error.message);
  }

  const nextBooking = Array.isArray(data) ? data[0] : data;
  return normalizeBooking(nextBooking);
}

export async function approveRescheduleRequest(bookingId, actorLabel) {
  const { data, error } = await supabase.rpc("approve_booking_reschedule_request", {
    target_booking_id: bookingId,
    actor_label: actorLabel || null,
  });

  if (error) {
    if (/approve_booking_reschedule_request|does not exist/i.test(error.message)) {
      throw new Error("Run fixbee_history_notifications_patch.sql in Supabase first.");
    }

    throw new Error(error.message);
  }

  const nextBooking = Array.isArray(data) ? data[0] : data;
  return normalizeBooking(nextBooking);
}

export async function assignWorkerToBooking(bookingId, workerId, adminLabel = "admin") {
  const current = await getBookingById(bookingId);
  const workers = await listProfiles("worker");
  const worker = workers.find((entry) => entry.id === workerId);

  const meta = appendTimeline(current.meta, {
    actor: adminLabel,
    status: current.status === "pending" ? "assigned" : current.status,
    title: worker ? `${worker.name} assigned` : "Worker assigned",
    note: "The booking has been routed to an available worker.",
  });

  const { data, error } = await supabase
    .from("bookings")
    .update({
      technician_id: workerId,
      status: current.status === "pending" ? "assigned" : current.status,
      notes: serializeBookingMeta(meta),
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (workerId) {
    await safeNotificationInsert({
      userId: workerId,
      title: "New job assigned",
      message: `You have been assigned to ${current.serviceName} on ${current.service_date}.`,
      type: "info",
    });
  }

  if (current.user_id) {
    await safeNotificationInsert({
      userId: current.user_id,
      title: "Worker assigned",
      message: `${worker?.name || "A professional"} has been assigned to your ${current.serviceName} booking.`,
      type: "info",
    });
  }

  return normalizeBooking(data);
}

export async function listNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (_error) {
    return [];
  }
}

export async function markAllNotificationsRead(userId) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  } catch (_error) {
    return null;
  }

  return true;
}

export async function clearNotifications(userId) {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
  } catch (_error) {
    return null;
  }

  return true;
}

export async function markNotificationRead(notificationId) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
  } catch (_error) {
    return null;
  }

  return true;
}

export async function clearBookingHistoryForRole({ role, bookingIds = null }) {
  const { data, error } = await supabase.rpc("clear_booking_history_for_role_items", {
    target_role: role,
    target_booking_ids: bookingIds?.length ? bookingIds : null,
  });

  if (error) {
    if (/clear_booking_history_for_role_items|does not exist/i.test(error.message)) {
      throw new Error("Run fixbee_history_notifications_patch.sql in Supabase first.");
    }

    throw new Error(error.message);
  }
  return Number(data || 0);
}

export async function listServiceReviews(serviceName) {
  const fallback = findServiceBlueprint(serviceName)?.reviews || [];

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("service", serviceName)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data?.length ? data : fallback;
  } catch (_error) {
    return fallback;
  }
}

export function subscribeToTable({ channelName, table, filter, onChange }) {
  let timeoutId = null;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter,
      },
      (payload) => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }

        timeoutId = window.setTimeout(() => {
          onChange(payload);
        }, 120);
      }
    )
    .subscribe();

  return () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    supabase.removeChannel(channel);
  };
}
