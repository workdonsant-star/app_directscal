import { BadgeCheck, Clock3, MapPin, MessageCircleMore } from "lucide-react";
import Image from "next/image";

import { buttonVariants } from "@/components/ui/button";

const specialistWhatsapp = "5511947641451";

export function SpecialistContactCard() {
  return (
    <section
      aria-labelledby="specialist-contact-title"
      className="rounded-[5px] border bg-card"
    >
      <div className="p-4">
        <Image
          src="/relatorios/omdx-modelo/assets/figma/don-santos.jpg"
          alt="Don Santos"
          width={64}
          height={64}
          loading="eager"
          className="size-16 rounded-full border object-cover"
        />

        <div className="mt-3 min-w-0">
          <h2
            id="specialist-contact-title"
            className="flex items-center gap-1.5 font-heading text-base font-semibold leading-tight tracking-[-0.02em]"
          >
            <BadgeCheck
              aria-label="Especialista Directscal verificado"
              className="size-4 shrink-0 text-primary"
            />
            Don Santos
          </h2>
        </div>

        <dl className="mt-4 space-y-2.5 border-t pt-3 text-xs">
          <div className="flex gap-2.5">
            <Clock3 aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            <div>
              <dt className="sr-only">Tempo como especialista</dt>
              <dd>Especialista há 2 anos</dd>
            </div>
          </div>

          <div className="flex gap-2.5">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            <div>
              <dt className="sr-only">Localização</dt>
              <dd>São Paulo, SP</dd>
            </div>
          </div>

          <div>
            <dt className="sr-only">WhatsApp</dt>
            <dd>
              <a
                href={`https://wa.me/${specialistWhatsapp}`}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  size: "sm",
                  className: "w-auto",
                })}
              >
                <MessageCircleMore aria-hidden="true" />
                Contato
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
