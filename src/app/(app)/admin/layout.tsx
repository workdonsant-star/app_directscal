import { redirect } from "next/navigation";

import { getCurrentAuthSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (session.user.role !== "superadmin") {
    redirect("/omdx");
  }

  return children;
}
