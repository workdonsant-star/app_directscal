import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRespondentGroups } from "@/lib/data/omdx-domain";
import type { DiagnosticShareLink, RespondentGroup } from "@/lib/types";

type ShareLinksProps = {
  disabled: boolean;
  links: DiagnosticShareLink[];
  copiedGroup: RespondentGroup | null;
  onCopy: (group: RespondentGroup, value: string) => void;
};

export function ShareLinks({
  disabled,
  links,
  copiedGroup,
  onCopy,
}: ShareLinksProps) {
  const respondentGroups = getRespondentGroups();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Links por grupo</CardTitle>
        <CardDescription>
          Compartilhe o link correto para preservar a leitura por camada da
          empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-3">
        {links.map((link) => {
          const copied = copiedGroup === link.group;
          const group = respondentGroups.find((item) => item.id === link.group);

          return (
            <article
              key={link.group}
              className="flex min-w-0 flex-col gap-4 rounded-lg border bg-background p-4"
            >
              <div>
                <p className="text-base font-semibold text-foreground">
                  {group?.label ?? link.group}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {group?.description ?? "Link segmentado para preservar a leitura por camada."}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/40 p-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Link público
                </p>
                <code className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-foreground">
                  {link.publicUrl}
                </code>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => onCopy(link.group, link.publicUrl)}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Link copiado" : "Copiar link"}
                </Button>

                {disabled ? (
                  <Button type="button" variant="ghost" disabled>
                    <ExternalLink className="size-4" />
                    Abrir prévia
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    render={<Link href={link.previewPath} />}
                  >
                    <ExternalLink className="size-4" />
                    Abrir prévia
                  </Button>
                )}
              </div>

              <div className="mt-auto rounded-lg border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Mensagem sugerida
                </p>
                <p className="mt-2 text-xs leading-relaxed text-foreground">
                  {link.suggestedMessage}
                </p>
              </div>
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
