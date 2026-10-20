import { MapPin, Mail, UserRound } from "lucide-react";
import Image from "next/image";

import { buttonVariants } from "@/components/ui/button";
import type { PublishedSpecialistContact } from "@/lib/data/person-profiles-data-source";

export function SpecialistContactCard({ specialist }: { specialist: PublishedSpecialistContact | null }) {
  if (!specialist) {
    return <p className="text-xs text-muted-foreground">O contato do especialista desta entrega ainda não está disponível.</p>;
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
