import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import {
  listProfiles,
  peekProfilesCache,
  reviewWorkerApplication,
  subscribeToTable,
  updateProfileRecord,
} from "../../services/platformService.js";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import {
  canWorkerTakeAssignments,
  isPendingWorkerApplication,
  isRejectedWorkerApplication,
} from "../../utils/profile.js";

const ROLE_OPTIONS = ["user", "worker", "admin"];

export default function AdminPeoplePage() {
  const { pushToast } = useToast();
  const cachedPeople = peekProfilesCache();
  const [people, setPeople] = useState(cachedPeople || []);
  const [loading, setLoading] = useState(cachedPeople === undefined);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await listProfiles();
        setPeople(data);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(cachedPeople === undefined);

    return subscribeToTable({
      channelName: "admin-people",
      table: "profiles",
      onChange: () => load(false),
    });
  }, [cachedPeople]);

  async function handleRoleChange(person, nextRole) {
    try {
      await updateProfileRecord(person.id, {
        role: nextRole,
        ...(nextRole === "worker"
          ? {
              worker_application_status: "approved",
              worker_reviewed_at: new Date().toISOString(),
              is_accepting_jobs: true,
            }
          : {}),
      });
      setPeople((current) =>
        current.map((entry) =>
          entry.id === person.id
            ? {
                ...entry,
                role: nextRole,
                ...(nextRole === "worker"
                  ? {
                      worker_application_status: "approved",
                      is_accepting_jobs: true,
                    }
                  : {}),
              }
            : entry
        )
      );
      pushToast({
        title: "Role updated",
        message: `Account role changed to ${nextRole}.`,
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Role update failed",
        message: error.message || "Unable to update the selected account.",
        type: "error",
      });
    }
  }

  async function handleApplicationReview(person, nextStatus) {
    setReviewingId(person.id);

    try {
      const updated = await reviewWorkerApplication(
        person.id,
        nextStatus,
        "Admin",
        nextStatus === "rejected"
          ? "Please review your districts and base location, then resubmit the application."
          : ""
      );
      setPeople((current) => current.map((entry) => (entry.id === person.id ? updated : entry)));
      pushToast({
        title: nextStatus === "approved" ? "Worker approved" : "Application sent back",
        message:
          nextStatus === "approved"
            ? "This account is now active on the worker dashboard."
            : "The applicant can update details and reapply.",
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Review failed",
        message: error.message || "Unable to review this worker request right now.",
        type: "error",
      });
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return <LoadingPanel rows={5} />;
  }

  const sortedPeople = [...people].sort((first, second) => {
    const firstPending = isPendingWorkerApplication(first) ? 1 : 0;
    const secondPending = isPendingWorkerApplication(second) ? 1 : 0;

    if (secondPending !== firstPending) {
      return secondPending - firstPending;
    }

    return String(first.name || "").localeCompare(String(second.name || ""));
  });
  const pendingApplications = sortedPeople.filter((person) => isPendingWorkerApplication(person));

  return (
    <div className="space-y-4">
      <div className="panel rounded-[30px] p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Hiring queue</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Worker applications and people access</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Pending worker requests stay here until approved. Existing workers remain active unless you change their role manually.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-2xl border border-amber-200/15 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
            Pending worker applications: {pendingApplications.length}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-300">
            Active workers available now: {sortedPeople.filter((person) => canWorkerTakeAssignments(person)).length}
          </div>
        </div>
      </div>

      {sortedPeople.map((person) => (
        <div key={person.id} className="panel rounded-[30px] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-2xl bg-amber-300/10 p-3 text-amber-200">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{person.name}</p>
                  <p className="text-sm text-slate-400">{person.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300">
                  Role: {person.role}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    isPendingWorkerApplication(person)
                      ? "border border-amber-200/15 bg-amber-300/8 text-amber-100"
                      : isRejectedWorkerApplication(person)
                        ? "border border-rose-200/15 bg-rose-400/8 text-rose-100"
                        : canWorkerTakeAssignments(person)
                          ? "border border-emerald-200/15 bg-emerald-400/8 text-emerald-100"
                          : "border border-white/10 bg-white/6 text-slate-300"
                  }`}
                >
                  {isPendingWorkerApplication(person)
                    ? "Application pending"
                    : isRejectedWorkerApplication(person)
                      ? "Needs update"
                      : canWorkerTakeAssignments(person)
                        ? "Ready for dispatch"
                        : "General access"}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500">{person.phone || "No phone number added yet"}</p>
              <p className="mt-2 text-sm text-slate-500">{person.address || "No address on file"}</p>
              {person.worker_service_state ? (
                <p className="mt-2 text-sm text-slate-400">
                  Coverage: {person.coverage_summary}
                </p>
              ) : null}
              {person.worker_service_location ? (
                <p className="mt-2 text-sm text-slate-500">
                  Base location: {person.worker_service_location}
                </p>
              ) : null}
              {person.worker_application_note ? (
                <p className="mt-3 text-sm leading-6 text-slate-400">{person.worker_application_note}</p>
              ) : null}
            </div>

            <div className="grid min-w-[240px] gap-3">
              {isPendingWorkerApplication(person) ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleApplicationReview(person, "approved")}
                    disabled={reviewingId === person.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
                  >
                    <CheckCircle2 className="size-4" />
                    {reviewingId === person.id ? "Saving..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplicationReview(person, "rejected")}
                    disabled={reviewingId === person.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200/15 bg-rose-400/8 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/12 disabled:opacity-60"
                  >
                    <XCircle className="size-4" />
                    {reviewingId === person.id ? "Saving..." : "Send back"}
                  </button>
                </div>
              ) : null}
              <select
                value={person.role || "user"}
                onChange={(event) => handleRoleChange(person, event.target.value)}
                className="input-shell w-full rounded-2xl px-4 py-3.5"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
