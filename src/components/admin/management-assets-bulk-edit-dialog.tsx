"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { managementAssetBulkUpdateSchema, type ManagementAssetBulkUpdate } from "@/lib/contracts";

type Field = keyof ManagementAssetBulkUpdate["changes"];
const fields: Array<{ value: Field; label: string }> = [
  { value: "specialistId", label: "Autor" },
  { value: "category", label: "Categoria" },
  { value: "ownerLabel", label: "Líder responsável" },
  { value: "reviewCycle", label: "Ciclo de revisão" },
];
const cycles = ["Mensal", "Trimestral", "Semestral", "Anual", "Sob demanda"];

export function ManagementAssetsBulkEditDialog({ organizationId, assetIds, specialists, pending, error, onClose, onSave }: {
  organizationId: string;
  assetIds: string[];
  specialists: Array<{ id: string; name: string }>;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: ManagementAssetBulkUpdate) => Promise<void>;
}) {
  const [field, setField] = useState<Field>("specialistId");
  const [value, setValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const choices = field === "specialistId"
    ? [{ value: "directscal", label: "Directscal (sem especialista)" }, ...specialists.map((item) => ({ value: item.id, label: item.name }))]
    : cycles.map((cycle) => ({ value: cycle, label: cycle }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (field === "specialistId" && !value) { setValidationError("Selecione o autor."); return; }
    const parsed = managementAssetBulkUpdateSchema.safeParse({ organizationId, assetIds, changes: {
      [field]: field === "specialistId" ? (value === "directscal" ? null : value) : field === "category" ? (value.trim() || null) : value.trim(),
    } });
    if (!parsed.success) { setValidationError("Revise o valor informado."); return; }
    setValidationError(null);
    await onSave(parsed.data);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {assetIds.length} {assetIds.length === 1 ? "ativo" : "ativos"}</DialogTitle>
          <DialogDescription>O campo escolhido será alterado em todos os ativos selecionados. Conteúdo e histórico de versões serão preservados.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="bulk-field" className="text-sm font-medium">Campo a alterar</label>
            <Select value={field} items={fields} disabled={pending} onValueChange={(next) => { if (typeof next === "string") { setField(next as Field); setValue(""); setValidationError(null); } }}>
              <SelectTrigger id="bulk-field" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{fields.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bulk-value" className="text-sm font-medium">{fields.find((item) => item.value === field)?.label}</label>
            {field === "specialistId" || field === "reviewCycle" ? (
              <Select value={value || null} items={choices} disabled={pending} onValueChange={(next) => { if (typeof next === "string") setValue(next); }}>
                <SelectTrigger id="bulk-value" className="w-full"><SelectValue placeholder="Selecione uma opção" /></SelectTrigger>
                <SelectContent>{choices.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            ) : <Input id="bulk-value" value={value} maxLength={field === "category" ? 80 : 120} disabled={pending} onChange={(event) => setValue(event.target.value)} />}
            {field === "category" ? <p className="text-xs text-muted-foreground">Deixe em branco para remover a categoria.</p> : null}
            {field === "specialistId" ? <p className="text-xs text-muted-foreground">A autoria usa o especialista Directscal atribuído ao ativo.</p> : null}
          </div>
          {validationError || error ? <p role="alert" className="text-sm text-destructive">{validationError ?? error}</p> : null}
          <DialogFooter>
            <Button variant="secondary" type="button" disabled={pending} onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Salvando" : "Salvar alterações"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
