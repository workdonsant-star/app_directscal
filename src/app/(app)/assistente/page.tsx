import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AiChatWorkspace } from "@/components/ai-chat/ai-chat-workspace";
import { AppTopbar } from "@/components/app-topbar";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Agente — Directscal",
};

export default async function AssistantPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(session.user)) {
    redirect("/admin/operacao");
  }

  return (
    <>
      <AppTopbar />

      <main className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col">
        <AiChatWorkspace
          user={{ id: session.user.id, name: session.user.name }}
        />
      </main>
    </>
  );
}
