"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  editableManagementAssetTypeValues,
  managementAssetTypeLabels,
  type EditableManagementAssetType,
  type QuickCreateManagementAssetInput,
} from "@/lib/contracts";

const noCategory = "__sem_categoria__";
const typeDescriptions: Record<EditableManagementAssetType, string> = {
  sop: "Procedimento com objetivo, responsabilidades e passos.",
  playbook: "Orientações e decisões para uma situação recorrente.",
  governanca: "Regras, critérios e alçadas de decisão.",
  raci: "Papéis e responsabilidades por atividade.",
};

export function ManagementAssetCreateForm({
  organizationId,
  categories,
  pending,
  onSubmit,
}: {
  organizationId: string;
  categories: string[];
  pending: boolean;
  onSubmit: (input: QuickCreateManagementAssetInput) => void;
}) {
  const [category, setCategory] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="new-asset-category" className="text-sm font-medium">Categoria</label>
        <Select
          value={category}
          items={[
            ...categories.map((name) => ({ value: name, label: name })),
            { value: noCategory, label: "Sem categoria" },
          ]}
          onValueChange={(value) => setCategory(typeof value === "string" ? value : null)}
          disabled={pending}
        >
          <SelectTrigger id="new-asset-category" className="h-10 w-full">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            <SelectItem value={noCategory}>Sem categoria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Tipo de ativo</p>
          <p className="text-xs text-muted-foreground">Escolher abre o editor</p>
        </div>
        <div className="divide-y divide-border">
          {editableManagementAssetTypeValues.map((type) => (
            <button
              key={type}
              type="button"
              disabled={category === null || pending}
              onClick={() => onSubmit({
                organizationId,
                type,
                category: category === noCategory ? null : category,
              })}
              className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-3 text-left outline-none transition-colors hover:bg-action-neutral-hover focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">{managementAssetTypeLabels[type]}</span>
                <span className="text-xs text-muted-foreground">{typeDescriptions[type]}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
