"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { managementAssetTypeLabels } from "@/lib/contracts/management-assets";
import { getManagementAssetHref } from "@/lib/data/management-asset-routes";
import type { ManagementAsset } from "@/lib/types";

const allCategories = "Todas as categorias";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function authorInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getAssetHref(asset: ManagementAsset) {
  return getManagementAssetHref(asset.type, asset.id);
}

function ManagementAssetCard({ asset, showType }: { asset: ManagementAsset; showType: boolean }) {
  const href = getAssetHref(asset);
  const card = (
    <Card
      className={
        href
          ? "h-full min-h-[277px] rounded-[5px] bg-sidebar ring-0 transition-colors duration-150 group-hover:bg-muted/50 group-active:bg-muted"
          : "h-full min-h-[277px] rounded-[5px] bg-sidebar ring-0"
      }
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          {showType || asset.category ? (
            <Badge className="h-5 rounded-[5px] px-2 text-[10px] leading-4" variant="outline">
              {showType ? managementAssetTypeLabels[asset.type] : asset.category}
            </Badge>
          ) : (
            <span />
          )}
          {href ? (
            <ChevronRight
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          ) : null}
        </div>
        <CardTitle className="line-clamp-2 text-lg leading-7">
          {asset.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-6">
        <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">
          {asset.summary}
        </p>

        <div className="space-y-3 border-t pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar size="sm">
              {asset.author.avatarUrl ? (
                <AvatarImage src={asset.author.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>
                {authorInitials(asset.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">
                {asset.author.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {asset.author.role}
              </p>
            </div>
          </div>

          <p className="text-sm leading-5 text-muted-foreground">
            <time
              dateTime={asset.updatedAt}
              aria-label={`Atualizado em ${dateFormatter.format(new Date(asset.updatedAt))}`}
              className="tabular-nums"
            >
              {dateFormatter.format(new Date(asset.updatedAt))}
            </time>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link
      href={href}
      className="group rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label={`Abrir ${managementAssetTypeLabels[asset.type]} ${asset.title}`}
    >
      {card}
    </Link>
  ) : (
    card
  );
}

export function ManagementAssetsLibrary({
  assets,
  categoryFilter,
  showType = false,
}: {
  assets: ManagementAsset[];
  categoryFilter: boolean;
  showType?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allCategories);
  const categories = useMemo(
    () => [
      allCategories,
      ...Array.from(
        new Set(
          assets.flatMap((asset) =>
            asset.category === null ? [] : [asset.category],
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    ],
    [assets],
  );
  const categoryItems = useMemo(
    () => categories.map((item) => ({ label: item, value: item })),
    [categories],
  );
  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

    return assets.filter((asset) => {
      const matchesCategory =
        !categoryFilter ||
        category === allCategories ||
        asset.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${asset.title} ${asset.summary} ${asset.category ?? ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [assets, category, categoryFilter, query]);

  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="font-heading text-base font-medium">
          Nenhum ativo disponível
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Os conteúdos aparecem aqui depois que forem publicados pela Directscal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppTopbarActionsPortal>
        <div className="flex min-w-0 items-center gap-3">
          {categoryFilter ? (
            <Select
              value={category}
              items={categoryItems}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setCategory(value);
                }
              }}
            >
              <SelectTrigger
                aria-label="Filtrar por categoria"
                className="w-44 xl:w-56"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <div className="relative w-56 xl:w-96">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Buscar por título ou conteúdo"
              aria-label="Buscar ativos"
              className="pl-8"
            />
          </div>
        </div>
      </AppTopbarActionsPortal>

      {filteredAssets.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="font-heading text-base font-medium">
            Nenhum resultado encontrado
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajuste a busca ou selecione outra categoria.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredAssets.map((asset) => (
            <ManagementAssetCard key={asset.id} asset={asset} showType={showType} />
          ))}
        </div>
      )}
    </div>
  );
}
