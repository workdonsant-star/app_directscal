"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminLeadsTable() {
  const { leads } = useAdminData();
  const router = useRouter();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold">
            Leads capturados
          </h2>
          <p className="text-muted-foreground text-sm">
            Lista unificada dos cadastros feitos pelos links de aquisição.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/campanhas" />}
        >
          Ver campanhas
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead className="text-right">Criado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const detailPath = `/admin/leads/${lead.id}`;

              return (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => router.push(detailPath)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={detailPath}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {lead.name}
                      </Link>
                      <span className="text-muted-foreground text-xs">
                        {lead.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-foreground">
                        {lead.companyName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {lead.companySize ?? "Tamanho não informado"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.campaignName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source}
                  </TableCell>
                  <TableCell className="max-w-[18rem] text-muted-foreground">
                    <span className="line-clamp-2">
                      {lead.objective || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatDateTime(lead.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}

            {leads.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Nenhum lead capturado até agora.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
