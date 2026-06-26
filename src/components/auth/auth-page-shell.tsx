import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AuthGradientVisual } from "@/components/auth/auth-gradient-visual";
import { cn } from "@/lib/utils";

type AuthVisualVariant = "liquid" | "app";

function AuthBackgroundVideo({ className }: { className: string }) {
  return (
    <video
      aria-hidden="true"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className={className}
    >
      <source src="/liquid_background.mp4" type="video/mp4" />
    </video>
  );
}

function AuthAppVisual({
  canvasId,
  className,
}: {
  canvasId: string;
  className: string;
}) {
  return <AuthGradientVisual canvasId={canvasId} className={className} />;
}

function AuthVisual({
  canvasId,
  className,
  variant,
}: {
  canvasId: string;
  className: string;
  variant: AuthVisualVariant;
}) {
  if (variant === "app") {
    return <AuthAppVisual canvasId={canvasId} className={className} />;
  }

  return <AuthBackgroundVideo className={className} />;
}

const appReviewQuote =
  "“Em termos de capacidade de entrega, controle e gestão da operação, tivemos uma melhora de 100%. Hoje, a maior parte do meu dia já não é mais dedicada a apagar incêndios. Essa é uma transformação completa em relação à realidade que vivíamos antes.”";

function DirectscalLogo({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Directscal"
      className={cn(
        "inline-flex w-fit rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <Image
        src="/directscal-logo.svg"
        alt="Directscal"
        width={115}
        height={16}
        className={cn("h-5 w-auto dark:hidden", imageClassName)}
      />
      <Image
        src="/directscal-logo-dark.svg"
        alt="Directscal"
        width={115}
        height={16}
        className={cn("hidden h-5 w-auto dark:block", imageClassName)}
      />
    </Link>
  );
}

export function AuthPageShell({
  children,
  description,
  footer,
  title,
  visualVariant = "liquid",
}: {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  title: ReactNode;
  visualVariant?: AuthVisualVariant;
}) {
  if (visualVariant === "app") {
    return (
      <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
        <section className="grid min-h-dvh lg:grid-cols-[minmax(560px,50.833vw)_minmax(0,1fr)]">
          <div className="relative flex min-h-dvh items-center px-6 py-10 pt-24 sm:px-10 lg:px-0 lg:pl-[clamp(5rem,10.8vw,9.75rem)] lg:pr-16 lg:pt-10">
            <DirectscalLogo
              className="absolute left-6 top-8 sm:left-10 lg:left-[clamp(5rem,10.8vw,9.75rem)] lg:top-[88px]"
              imageClassName="h-4"
            />
            <div className="mx-auto flex w-full max-w-[396px] flex-col lg:mx-0">
              <div className="mb-8 h-36 overflow-hidden rounded-[2rem] border bg-muted/20 lg:hidden">
                <AuthGradientVisual
                  canvasId="gradient-canvas-mobile"
                  className="h-full w-full"
                />
              </div>
              <header className="mb-5">
                <h1 className="max-w-[360px] text-2xl font-semibold leading-[1.18] tracking-normal">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-2.5 max-w-[360px] text-xs leading-[18px] text-foreground/80 dark:text-muted-foreground">
                    {description}
                  </p>
                ) : null}
                <div className="mt-5 h-px w-full bg-border" />
              </header>
              {children}
              {footer ? <div className="mt-6">{footer}</div> : null}
            </div>
          </div>
          <aside className="relative hidden min-h-dvh overflow-hidden rounded-l-[104px] bg-auth-gradient-purple lg:block">
            <div className="absolute inset-0">
              <AuthGradientVisual
                canvasId="gradient-canvas"
                className="h-full w-full"
              />
            </div>
            <div className="absolute left-[19.5%] top-[31.8%] z-20 w-[61%] max-w-[432px] rounded-[9px] bg-[var(--auth-quote-card)] px-[30px] py-8 text-[var(--auth-quote-foreground)]">
              <p className="max-w-[410px] text-[19px] font-semibold leading-[1.45] tracking-normal">
                {appReviewQuote}
              </p>
              <div className="mt-7 flex items-center gap-3">
                <Image
                  src="/auth-caio-farah.png"
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold leading-none text-[var(--auth-quote-foreground)]">
                    Caio Farah
                  </p>
                  <p className="mt-1 text-xs leading-4 text-[var(--auth-quote-muted)]">
                    CEO e Fahto Media Group
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[minmax(360px,0.92fr)_minmax(0,1.08fr)]">
      <section className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            aria-label="Directscal"
            className="mb-10 inline-flex rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <picture>
              <source
                srcSet="/directscal-logo-dark.svg"
                media="(prefers-color-scheme: dark)"
              />
              <img
                src="/directscal-logo.svg"
                alt="Directscal"
                className="h-5 w-auto"
              />
            </picture>
          </Link>
          <div className="mb-8 overflow-hidden rounded-lg border bg-muted/20 lg:hidden">
            <AuthVisual
              canvasId="gradient-canvas-mobile"
              className="aspect-[16/10] w-full object-cover"
              variant={visualVariant}
            />
          </div>
          <header className={cn(description ? "mb-8" : "sr-only")}>
            <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
            {description ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </header>
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </section>
      <aside className="hidden min-h-dvh border-l bg-muted/20 lg:block">
        <AuthVisual
          canvasId="gradient-canvas"
          className="h-dvh w-full object-cover"
          variant={visualVariant}
        />
      </aside>
    </main>
  );
}
