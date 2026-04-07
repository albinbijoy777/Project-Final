export const BOOKING_FILTERS = [
  { value: "all", label: "All", statuses: null },
  { value: "booked", label: "Booked", statuses: ["pending", "assigned"] },
  { value: "pending", label: "Pending", statuses: ["pending"] },
  { value: "assigned", label: "Assigned", statuses: ["assigned"] },
  { value: "in_progress", label: "In progress", statuses: ["in_progress"] },
  { value: "completed", label: "Completed", statuses: ["completed"] },
  { value: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

export function getStatusesForBookingFilter(filterValue) {
  return BOOKING_FILTERS.find((item) => item.value === filterValue)?.statuses ?? null;
}

export function matchesBookingFilter(booking, filterValue) {
  const statuses = getStatusesForBookingFilter(filterValue);
  if (!statuses?.length) {
    return true;
  }

  return statuses.includes(booking.status);
}
