"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Diagnostic } from "@/lib/types";

type DeleteDiagnosticDialogProps = {
  diagnostic: Diagnostic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (diagnostic: Diagnostic) => void;
};

export function DeleteDiagnosticDialog({
  diagnostic,
  open,
  onOpenChange,
  onConfirm,
}: DeleteDiagnosticDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir diagnóstico</DialogTitle>
          <DialogDescription>
            {diagnostic
              ? `Tem certeza que deseja excluir “${diagnostic.name}”? Esta ação remove o diagnóstico apenas desta sessão mockada.`
              : "Tem certeza que deseja excluir este diagnóstico?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              if (!diagnostic) return;
              onConfirm(diagnostic);
            }}
          >
            Excluir diagnóstico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
