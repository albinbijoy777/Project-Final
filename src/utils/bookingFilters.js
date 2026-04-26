export const BOOKING_FILTERS = [
  { value: "all", label: "All", statuses: null },
  { value: "booked", label: "Booked", statuses: ["pending", "assigned"] },
  { value: "pending", label: "Pending", statuses: ["pending"] },
  { value: "assigned", label: "Assigned", statuses: ["assigned"] },
  { value: "in_progress", label: "In progress", statuses: ["in_progress"] },
  { value: "completed", label: "Completed", statuses: ["completed"] },
  { value: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

export const BOOKING_SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest_price", label: "Highest price" },
  { value: "lowest_price", label: "Lowest price" },
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

export function matchesBookingSearch(booking, searchValue) {
  const query = String(searchValue || "").trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [
    booking.serviceName,
    booking.address,
    booking.requirementDetails,
    booking.status,
    booking.assignedWorkerName,
    booking.rescheduleRequest?.requestedDate,
    booking.rescheduleRequest?.requestedTime,
    booking.rescheduleRequest?.reason,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

export function matchesBookingDate(booking, dateValue) {
  if (!dateValue) {
    return true;
  }

  return booking.service_date === dateValue;
}

function getBookingTimestamp(booking) {
  const serviceDate = booking?.service_date ? new Date(`${booking.service_date}T00:00:00`).getTime() : 0;
  const createdAt = booking?.created_at ? new Date(booking.created_at).getTime() : 0;
  return serviceDate || createdAt || 0;
}

export function sortBookings(bookings, sortValue) {
  const list = [...bookings];

  switch (sortValue) {
    case "oldest":
      return list.sort((first, second) => getBookingTimestamp(first) - getBookingTimestamp(second));
    case "highest_price":
      return list.sort((first, second) => Number(second.price || 0) - Number(first.price || 0));
    case "lowest_price":
      return list.sort((first, second) => Number(first.price || 0) - Number(second.price || 0));
    case "latest":
    default:
      return list.sort((first, second) => getBookingTimestamp(second) - getBookingTimestamp(first));
  }
}
