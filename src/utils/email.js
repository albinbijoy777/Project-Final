export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function getEmailPlaceholder() {
  return "name@example.com";
}

export function getEmailFieldLabel() {
  return "Email address";
}

export function getEmailRuleText() {
  return "Any valid email address can be used for sign in and signup.";
}

export function isApprovedEmail(email) {
  const normalized = normalizeEmail(email);
  return Boolean(normalized);
}

export function assertApprovedEmail(email) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    throw new Error("Enter your email address.");
  }

  return normalized;
}
