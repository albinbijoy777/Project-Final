export function parseBookingMeta(notes) {
  if (!notes) return {};

  if (typeof notes === "object" && !Array.isArray(notes)) {
    return notes;
  }

  if (typeof notes !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(notes);
    return typeof parsed === "object" && parsed ? parsed : { details: notes };
  } catch (_error) {
    return { details: notes };
  }
}

export function serializeBookingMeta(meta) {
  return JSON.stringify(meta ?? {});
}

export function appendTimeline(meta, entry) {
  const timeline = Array.isArray(meta?.timeline) ? meta.timeline : [];
  return {
    ...meta,
    timeline: [
      ...timeline,
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...entry,
      },
    ],
  };
}
