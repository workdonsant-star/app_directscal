import { authUserSchema, type AuthUser } from "@/lib/contracts";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type PendingAcquisitionGoogleUserInput = {
  email?: unknown;
  name?: unknown;
  userEmail?: unknown;
  userId?: unknown;
};

export function resolvePendingAcquisitionGoogleUser({
  email,
  name,
  userEmail,
  userId,
}: PendingAcquisitionGoogleUserInput): AuthUser | null {
  if (typeof email !== "string" || typeof userId !== "string") return null;

  const normalizedEmail = normalizeEmail(email);
  const normalizedUserEmail =
    typeof userEmail === "string" ? normalizeEmail(userEmail) : null;

  if (!normalizedEmail || !userId.trim()) return null;
  if (normalizedUserEmail && normalizedUserEmail !== normalizedEmail) {
    return null;
  }

  const parsedUser = authUserSchema.safeParse({
    company: "Empresa pendente",
    email: normalizedEmail,
    id: userId,
    name: typeof name === "string" && name.trim() ? name.trim() : normalizedEmail,
    role: "cliente",
  });

  return parsedUser.success ? parsedUser.data : null;
}
