function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

export function collectRescheduleRequest(currentDate = "", currentTime = "") {
  const requestedDate = window.prompt("Enter new date (YYYY-MM-DD)", currentDate || "");
  if (requestedDate === null) {
    return null;
  }

  const trimmedDate = requestedDate.trim();
  if (!isIsoDate(trimmedDate)) {
    throw new Error("Use the date format YYYY-MM-DD.");
  }

  const requestedTime = window.prompt("Enter new time (for example 10:30 AM)", currentTime || "");
  if (requestedTime === null) {
    return null;
  }

  const trimmedTime = requestedTime.trim();
  if (!trimmedTime) {
    throw new Error("Time is required.");
  }

  const reason = window.prompt("Why do you need to reschedule this booking?", "") ?? "";

  return {
    requestedDate: trimmedDate,
    requestedTime: trimmedTime,
    reason: reason.trim(),
  };
}
