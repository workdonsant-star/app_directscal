import Link from "next/link";
import type { ReactNode } from "react";

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

export function AuthPageShell({
  children,
  description,
  footer,
  title,
}: {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  title: string;
}) {
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
            <AuthBackgroundVideo className="aspect-[16/10] w-full object-cover" />
          </div>
          <div className="mb-8">
            <h2 className="font-heading text-2xl leading-tight font-medium text-balance">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </section>
      <aside className="hidden min-h-dvh border-l bg-muted/20 lg:block">
        <AuthBackgroundVideo className="h-dvh w-full object-cover" />
      </aside>
    </main>
  );
}
