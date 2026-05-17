import type { AuthRole, AuthUser } from "@/lib/contracts";

type GoogleProfileLike = {
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  sub?: unknown;
};

function normalizeList(value?: string) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getEmailDomain(email: string) {
  const [, domain] = email.split("@");

  return domain?.trim().toLowerCase() ?? "";
}

function parseOrganizationMap() {
  const rawValue = process.env.AUTH_ORG_BY_DOMAIN;

  if (!rawValue) return new Map<string, string>();

  try {
    const parsed: unknown = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new Map<string, string>();
    }

    return new Map(
      Object.entries(parsed)
        .filter(
          (entry): entry is [string, string] =>
            typeof entry[0] === "string" && typeof entry[1] === "string",
        )
        .map(([domain, company]) => [domain.trim().toLowerCase(), company]),
    );
  } catch {
    return new Map<string, string>();
  }
}

function getRoleForEmail(email: string): AuthRole {
  const superadminEmails = normalizeList(process.env.AUTH_SUPERADMIN_EMAILS);
  const adminEmails = normalizeList(process.env.AUTH_ADMIN_EMAILS);

  if (superadminEmails.includes(email)) return "superadmin";
  if (adminEmails.includes(email)) return "admin";

  return "cliente";
}

function getCompanyForDomain(domain: string) {
  return parseOrganizationMap().get(domain) ?? domain;
}

function getFallbackName(email: string) {
  const [localPart] = email.split("@");

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isDevPasswordLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_ENABLE_DEV_PASSWORD_LOGIN === "true"
  );
}

export function isGoogleAuthConfigured() {
  return Boolean(
    (process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      process.env.NODE_ENV !== "production") &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET,
  );
}

export function isCorporateEmailAllowed(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const domain = getEmailDomain(normalizedEmail);
  const allowedDomains = normalizeList(process.env.AUTH_ALLOWED_DOMAINS);
  const allowedEmails = normalizeList(process.env.AUTH_ALLOWED_EMAILS);

  if (!domain || allowedDomains.length === 0 || allowedEmails.length === 0) {
    return false;
  }

  return (
    allowedDomains.includes(domain) && allowedEmails.includes(normalizedEmail)
  );
}

export function isGoogleProfileAllowed(profile: unknown) {
  if (!profile || typeof profile !== "object") return false;

  const googleProfile = profile as GoogleProfileLike;

  return (
    googleProfile.email_verified === true &&
    typeof googleProfile.email === "string" &&
    isCorporateEmailAllowed(googleProfile.email)
  );
}

export function resolveAuthUserFromGoogleProfile(
  profile: unknown,
): AuthUser | null {
  if (!isGoogleProfileAllowed(profile)) return null;

  const googleProfile = profile as GoogleProfileLike;
  const email = normalizeEmail(String(googleProfile.email));
  const name =
    typeof googleProfile.name === "string" && googleProfile.name.trim()
      ? googleProfile.name.trim()
      : getFallbackName(email);
  const subject =
    typeof googleProfile.sub === "string" && googleProfile.sub.trim()
      ? googleProfile.sub.trim()
      : email;

  return resolveAuthUserFromEmail(email, name, subject);
}

export function resolveAuthUserFromEmail(
  email: string,
  name = getFallbackName(email),
  subject = email,
): AuthUser {
  const normalizedEmail = normalizeEmail(email);
  const domain = getEmailDomain(normalizedEmail);

  return {
    id: `google:${subject}`,
    name,
    email: normalizedEmail,
    company: getCompanyForDomain(domain),
    role: getRoleForEmail(normalizedEmail),
  };
}
