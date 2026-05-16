import type { AuthUser } from "@/lib/contracts";

export function getSignedInRedirectPath(user: Pick<AuthUser, "role">) {
  return user.role === "superadmin" ? "/admin/modulos" : "/omdx";
}
