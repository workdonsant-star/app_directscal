import { authUserSchema, type AuthUser } from "@/lib/contracts";
import type { LeadershipInvitationPreview } from "@/lib/data/organization-structure-data-source";

export const leadershipInvitationOauthCookieName =
  "directscal_leadership_invitation";
export const leadershipInvitationOauthMaxAge = 60 * 15;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getLeadershipInvitationOauthErrorPath(
  rawToken: string,
  error: "confirmacao" | "conta-google" | "sessao-google",
) {
  const params = new URLSearchParams({ erro: error });

  return `/convites/lideranca/${encodeURIComponent(rawToken)}?${params.toString()}`;
}

export function resolvePendingLeadershipGoogleUser({
  email,
  invitation,
  name,
  userEmail,
  userId,
}: {
  email?: unknown;
  invitation: LeadershipInvitationPreview;
  name?: unknown;
  userEmail?: unknown;
  userId?: unknown;
}): AuthUser | null {
  if (typeof email !== "string" || typeof userId !== "string") return null;

  const normalizedEmail = normalizeEmail(email);
  const invitedEmail = normalizeEmail(invitation.leaderEmail);
  const normalizedUserEmail =
    typeof userEmail === "string" ? normalizeEmail(userEmail) : null;

  if (!normalizedEmail || !userId.trim()) return null;
  if (normalizedEmail !== invitedEmail) return null;
  if (normalizedUserEmail && normalizedUserEmail !== normalizedEmail) {
    return null;
  }

  const parsedUser = authUserSchema.safeParse({
    company: invitation.companyName,
    email: normalizedEmail,
    id: userId,
    name:
      typeof name === "string" && name.trim() ? name.trim() : normalizedEmail,
    role: invitation.accessLevel === "owner" ? "cliente" : "admin",
  });

  return parsedUser.success ? parsedUser.data : null;
}
