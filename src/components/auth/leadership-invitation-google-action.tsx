"use client";

import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

async function getResponseMessage(response: Response) {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;
    if (typeof message === "string") return message;
  }

  return "Não foi possível iniciar a confirmação com Google.";
}

export function LeadershipInvitationGoogleAction({
  invitedEmail,
  token,
}: {
  invitedEmail: string;
  token: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/leadership-invitations", {
        body: JSON.stringify({ token }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        setError(await getResponseMessage(response));
        setIsSubmitting(false);
        return;
      }

      const data = (await response.json()) as { callbackUrl?: string };

      await signOut({ redirect: false });
      await signIn(
        "google",
        {
          callbackUrl:
            data.callbackUrl ?? "/api/auth/leadership-invitations/complete",
        },
        {
          login_hint: invitedEmail,
          prompt: "select_account",
        },
      );
    } catch {
      setError("Não foi possível iniciar a confirmação com Google.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Button
        className="h-[45px] w-full gap-2.5 text-sm"
        disabled={isSubmitting}
        onClick={handleConfirm}
        type="button"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="size-4"
          height={18}
          src="/auth-figma-google.svg"
          width={18}
        />
        {isSubmitting ? "Abrindo Google" : "Confirmar com Google"}
      </Button>

      {error ? (
        <p className="text-sm leading-5 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
