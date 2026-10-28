import { MapPin, Mail, UserRound } from "lucide-react";
import Image from "next/image";

import { buttonVariants } from "@/components/ui/button";
type PublishedSpecialistContact = { name: string; email: string; title: string; location: string; avatarUrl: string | null };

export function SpecialistContactCard({ specialist, compact = false }: { specialist: PublishedSpecialistContact | null; compact?: boolean }) {
  if (!specialist) {
    return <p className="text-xs text-muted-foreground">O contato do especialista desta entrega ainda não está disponível.</p>;
  }
  if (compact) {
    return (
      <section aria-label={`Contato de ${specialist.name}`} className="space-y-2">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">{specialist.name}</h2>
          <p className="text-xs leading-5 text-muted-foreground">{specialist.title}</p>
        </div>
        <a href={`mailto:${specialist.email}`} className="inline-flex items-center gap-1.5 rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring">
          <Mail aria-hidden="true" className="size-3.5" />
          Entrar em contato
        </a>
      </section>
    );
  }
  return (
    <section aria-labelledby="specialist-contact-title" className="rounded-[5px] bg-card">
      <div className="p-4">
        {specialist.avatarUrl ? (
          <Image src={specialist.avatarUrl} alt={specialist.name} width={64} height={64} className="size-16 rounded-full border object-cover" />
        ) : (
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-6" /></span>
        )}
        <div className="mt-3 min-w-0">
          <h2 id="specialist-contact-title" className="text-ui-title">{specialist.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{specialist.title}</p>
        </div>
        <dl className="mt-4 space-y-2.5 border-t pt-3 text-xs">
          <div className="flex gap-2.5">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            <div><dt className="sr-only">Localização</dt><dd>{specialist.location}</dd></div>
          </div>
          <div><dt className="sr-only">E-mail</dt><dd>
            <a href={`mailto:${specialist.email}`} className={buttonVariants({ size: "sm", className: "w-auto" })}>
              <Mail aria-hidden="true" /> Contato
            </a>
          </dd></div>
        </dl>
      </div>
    </section>
  );
}
