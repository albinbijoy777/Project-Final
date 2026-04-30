import { normalizeRole } from "./roles.js";
import { formatCoverageSummary, normalizeDistrictSelection } from "../data/indiaLocations.js";
import { normalizeCoordinate } from "./location.js";

const VALID_WORKER_APPLICATION_STATUSES = new Set([
  "not_requested",
  "pending",
  "approved",
  "rejected",
]);

export function normalizeWorkerApplicationStatus(status, role = "user") {
  const normalizedRole = normalizeRole(role);
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (VALID_WORKER_APPLICATION_STATUSES.has(normalizedStatus)) {
    return normalizedStatus;
  }

  return normalizedRole === "worker" ? "approved" : "not_requested";
}

export function normalizeProfileRecord(profile) {
  if (!profile) {
    return null;
  }

  const role = normalizeRole(profile.role);
  const workerServiceState = profile.worker_service_state || "";
  const workerServiceDistricts = normalizeDistrictSelection(
    workerServiceState,
    Array.isArray(profile.worker_service_districts) ? profile.worker_service_districts : []
  );

  return {
    ...profile,
    role,
    worker_application_status: normalizeWorkerApplicationStatus(profile.worker_application_status, role),
    worker_application_note: profile.worker_application_note || "",
    worker_application_submitted_at: profile.worker_application_submitted_at || null,
    worker_reviewed_at: profile.worker_reviewed_at || null,
    worker_service_state: workerServiceState,
    worker_service_districts: workerServiceDistricts,
    worker_service_location: profile.worker_service_location || "",
    worker_service_place_id: profile.worker_service_place_id || "",
    worker_service_latitude: normalizeCoordinate(profile.worker_service_latitude),
    worker_service_longitude: normalizeCoordinate(profile.worker_service_longitude),
    is_accepting_jobs: profile.is_accepting_jobs !== false,
    coverage_summary: formatCoverageSummary(workerServiceState, workerServiceDistricts),
  };
}

export function isPendingWorkerApplication(profile) {
  return normalizeWorkerApplicationStatus(profile?.worker_application_status, profile?.role) === "pending";
}

export function isRejectedWorkerApplication(profile) {
  return normalizeWorkerApplicationStatus(profile?.worker_application_status, profile?.role) === "rejected";
}

export function isApprovedWorker(profile) {
  return (
    normalizeRole(profile?.role) === "worker" &&
    normalizeWorkerApplicationStatus(profile?.worker_application_status, profile?.role) === "approved"
  );
}

export function canWorkerTakeAssignments(profile) {
  return isApprovedWorker(profile) && profile?.is_accepting_jobs !== false;
}
