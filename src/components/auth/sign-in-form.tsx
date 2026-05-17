"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSignedInRedirectPath } from "@/lib/auth/navigation";

async function getResponseMessage(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;

    if (typeof message === "string") return message;
  }

  return fallback;
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.26h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.55Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.05v2.58A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 13.92a6 6 0 0 1 0-3.84V7.5H3.05a10 10 0 0 0 0 9l3.35-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.96c1.47 0 2.8.51 3.84 1.5l2.86-2.87A9.61 9.61 0 0 0 12 2a9.99 9.99 0 0 0-8.95 5.5l3.35 2.58C7.2 7.72 9.4 5.96 12 5.96Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SignInForm({
  authErrorMessage,
  googleUnavailableMessage,
  passwordLoginEnabled = true,
}: {
  authErrorMessage?: string | null;
  googleUnavailableMessage?: string | null;
  passwordLoginEnabled?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const displayedError = error ?? authErrorMessage;

  async function handleGoogleSignIn() {
    setError(null);

    if (googleUnavailableMessage) {
      setError(googleUnavailableMessage);
      return;
    }

    setIsGoogleSubmitting(true);

    await signIn("google", { callbackUrl: "/entrar" }).catch(() => {
      setError("Não foi possível iniciar a entrada com Google.");
      setIsGoogleSubmitting(false);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember }),
    });

    if (!response.ok) {
      setError(
        await getResponseMessage(response, "Não foi possível entrar agora."),
      );
      setIsSubmitting(false);
      return;
    }

    const data: unknown = await response.json().catch(() => null);
    const responseRole =
      data &&
      typeof data === "object" &&
      "session" in data &&
      data.session &&
      typeof data.session === "object" &&
      "user" in data.session &&
      data.session.user &&
      typeof data.session.user === "object" &&
      "role" in data.session.user &&
      typeof data.session.user.role === "string"
        ? data.session.user.role
        : "cliente";
    const role =
      responseRole === "superadmin" || responseRole === "admin"
        ? responseRole
        : "cliente";

    router.push(getSignedInRedirectPath({ role }));
    router.refresh();
  }

  return (
    <div className="grid gap-5">
      {passwordLoginEnabled ? (
        <>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-11 rounded-md px-3"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Link
                  href="/recuperar-senha"
                  className="rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-11 rounded-md px-3"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 rounded border border-input accent-primary"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Lembrar de mim neste dispositivo
            </label>
            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando" : "Entrar"}
            </Button>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>Ou faça login com</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 bg-background"
        disabled={isGoogleSubmitting}
        onClick={handleGoogleSignIn}
      >
        <GoogleIcon />
        {isGoogleSubmitting ? "Abrindo Google" : "Google"}
      </Button>
      {displayedError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {displayedError}
        </p>
      ) : null}
    </div>
  );
}
