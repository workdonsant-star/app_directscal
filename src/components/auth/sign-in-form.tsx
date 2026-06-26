"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSignedInRedirectPath } from "@/lib/auth/navigation";

type PasswordLoginMode = "dev" | "superadmin";

async function getResponseMessage(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;

    if (typeof message === "string") return message;
  }

  return fallback;
}

export function SignInForm({
  authErrorMessage,
  googleUnavailableMessage,
  passwordLoginEnabled = true,
  passwordLoginMode = "dev",
}: {
  authErrorMessage?: string | null;
  googleUnavailableMessage?: string | null;
  passwordLoginEnabled?: boolean;
  passwordLoginMode?: PasswordLoginMode;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
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

    if (passwordLoginMode === "superadmin") {
      const result = await signIn("credentials", {
        callbackUrl: "/admin/modulos",
        email,
        flow: "app",
        password,
        redirect: false,
      }).catch(() => null);

      if (!result || result.error) {
        setError("E-mail ou senha inválidos.");
        setIsSubmitting(false);
        return;
      }

      router.push(getSignedInRedirectPath({ role: "superadmin" }));
      router.refresh();
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember: true }),
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
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-[45px] w-full gap-2.5 bg-background text-sm font-normal"
        disabled={isGoogleSubmitting}
        onClick={handleGoogleSignIn}
      >
        <Image
          src="/auth-figma-google.svg"
          alt=""
          width={18}
          height={18}
          className="size-4"
          aria-hidden="true"
        />
        {isGoogleSubmitting ? "Abrindo Google" : "Entrar com Google"}
      </Button>
      {passwordLoginEnabled ? (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs font-normal text-foreground/80 dark:text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="sr-only"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-[45px] px-2.5 text-sm md:text-sm"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="sr-only"
              >
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-[45px] px-2.5 pr-10 text-sm md:text-sm"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-label={
                    isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
                  }
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((value) => !value)}
                >
                  {isPasswordVisible ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-[45px] w-full text-sm font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando" : "Entre"}
            </Button>
          </form>
        </>
      ) : null}
      {displayedError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {displayedError}
        </p>
      ) : null}
      {passwordLoginEnabled ? (
        <p className="text-xs leading-[18px] text-muted-foreground">
          Esqueceu sua senha?{" "}
          <Link
            href="/recuperar-senha"
            className="rounded-sm text-foreground/80 underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-muted-foreground"
          >
            Recuperar acesso
          </Link>
        </p>
      ) : null}
    </div>
  );
}
