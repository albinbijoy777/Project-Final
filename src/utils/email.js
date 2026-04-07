export const APPROVED_EMAIL_DOMAIN = "@kristujayanti.com";

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isApprovedEmail(email) {
  const normalized = normalizeEmail(email);
  return normalized.endsWith(APPROVED_EMAIL_DOMAIN);
}

export function assertApprovedEmail(email) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    throw new Error("Enter your university email address.");
  }

  if (!isApprovedEmail(normalized)) {
    throw new Error(`Only ${APPROVED_EMAIL_DOMAIN} email addresses are allowed.`);
  }

  return normalized;
}
