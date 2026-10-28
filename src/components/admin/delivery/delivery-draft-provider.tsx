"use client";

import { useSpecialists } from "@/components/admin/use-specialists";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  buildInitialDimensionReading,
  buildInitialReport,
  reportFields,
} from "@/components/admin/delivery/delivery-draft";
import type {
  AdminDelivery,
  AdminDeliveryPublication,
  AdminDeliveryReportDraft,
  AdminDeliveryStatus,
} from "@/lib/contracts/admin-operations";
import {
  type AdminDeliveryAnalysis,
  adminActionPointTemplates,
} from "@/lib/data/admin-operations-data-source";

export type DeliveryOption = {
  closedAt: string;
  diagnosticName: string;
  id: string;
};

type DeliveryDraft = {
  actionPointsComplete: boolean;
  analysis: AdminDeliveryAnalysis;
  assignedSpecialistName: string | null;
  delivery: AdminDelivery;
  deliveryOptions: DeliveryOption[];
  dimensionReadings: Record<string, string>;
  feedback: string | null;
  feedbackKind: "success" | "error" | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  persistDelivery: (intent: "save" | "publish") => Promise<void>;
  readyToPublish: boolean;
  report: AdminDeliveryReportDraft;
  reportComplete: boolean;
  reportFilledCount: number;
  selectedActionPointIds: Set<string>;
  setDimensionReading: (dimensionId: string, value: string) => void;
  setReport: Dispatch<SetStateAction<AdminDeliveryReportDraft>>;
  setSpecialistId: (value: string) => void;
  specialistComplete: boolean;
  specialistId: string;
  status: AdminDeliveryStatus;
  toggleActionPoint: (actionPointId: string) => void;
};

const DeliveryDraftContext = createContext<DeliveryDraft | null>(null);

export function useDeliveryDraft() {
  const value = useContext(DeliveryDraftContext);
  if (!value) {
    throw new Error("useDeliveryDraft deve ser usado dentro de DeliveryDraftProvider.");
  }
  return value;
}

/**
 * Mantém o rascunho da entrega no layout para que relatório, action points e
 * leituras sobrevivam à navegação entre as etapas.
 */
export function DeliveryDraftProvider({
  analysis,
  children,
  delivery,
  deliveryOptions,
  publication,
}: {
  analysis: AdminDeliveryAnalysis;
  children: ReactNode;
  delivery: AdminDelivery;
  deliveryOptions: DeliveryOption[];
  publication: AdminDeliveryPublication | null;
}) {
  const { getSpecialist: getAdminSpecialist } = useSpecialists();
  const router = useRouter();
  const [status, setStatus] = useState<AdminDeliveryStatus>(delivery.status);
  const [specialistId, setSpecialistId] = useState(
    delivery.specialistId ?? "unassigned",
  );
  const [report, setReport] = useState(
    () => publication?.report ?? buildInitialReport(delivery.companyName),
  );
  const [selectedActionPointIds, setSelectedActionPointIds] = useState(
    () =>
      new Set(
        publication?.selectedActionPointIds ??
          adminActionPointTemplates.slice(0, 3).map((item) => item.id),
      ),
  );
  const [dimensionReadings, setDimensionReadings] = useState<
    Record<string, string>
  >(() => ({
    ...Object.fromEntries(
      analysis.dimensions.map((dimension) => [
        dimension.id,
        buildInitialDimensionReading(dimension),
      ]),
    ),
    ...publication?.dimensionReadings,
  }));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const content = JSON.stringify({ specialistId, report, dimensionReadings, selectedActionPointIds: [...selectedActionPointIds].sort() });
  const [savedContent, setSavedContent] = useState<string | null>(() => publication ? content : null);
  const hasUnsavedChanges = content !== savedContent;

  const reportFilledCount = reportFields.filter(
    (field) => report[field.key].trim().length >= 20,
  ).length;
  const reportComplete = reportFilledCount === reportFields.length;
  const actionPointsComplete = selectedActionPointIds.size > 0;
  const specialistComplete = specialistId !== "unassigned";
  const readyToPublish =
    reportComplete && actionPointsComplete && specialistComplete;

  async function persistDelivery(intent: "save" | "publish") {
    if (isSaving) return;
    if (intent === "publish" && !readyToPublish) return;

    setIsSaving(true);
    setFeedback(null);
    setFeedbackKind(null);
    const submittedContent = content;

    try {
      const response = await fetch(`/api/admin/deliveries/${delivery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          specialistId: specialistId === "unassigned" ? null : specialistId,
          report,
          dimensionReadings,
          selectedActionPointIds: [...selectedActionPointIds],
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        publication?: AdminDeliveryPublication;
      } | null;

      if (!response.ok || !result?.publication) {
        throw new Error(result?.message ?? "Não foi possível salvar a entrega. Sua redação foi preservada; tente novamente.");
      }

      setStatus(result.publication.status);
      setSavedContent(submittedContent);
      setFeedbackKind("success");
      setFeedback(
        intent === "publish"
          ? "Entrega publicada. O relatório já está disponível para o cliente."
          : "Rascunho salvo.",
      );
      router.refresh();
    } catch (error) {
      setFeedbackKind("error");
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a entrega.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleActionPoint(actionPointId: string) {
    setSelectedActionPointIds((current) => {
      const next = new Set(current);
      if (next.has(actionPointId)) next.delete(actionPointId);
      else next.add(actionPointId);
      return next;
    });
  }

  function setDimensionReading(dimensionId: string, value: string) {
    setDimensionReadings((current) => ({ ...current, [dimensionId]: value }));
  }

  return (
    <DeliveryDraftContext.Provider
      value={{
        actionPointsComplete,
        analysis,
        assignedSpecialistName:
          getAdminSpecialist(specialistId === "unassigned" ? null : specialistId)
            ?.name ?? null,
        delivery,
        deliveryOptions,
        dimensionReadings,
        feedback,
        feedbackKind,
        hasUnsavedChanges,
        isSaving,
        persistDelivery,
        readyToPublish,
        report,
        reportComplete,
        reportFilledCount,
        selectedActionPointIds,
        setDimensionReading,
        setReport,
        setSpecialistId,
        specialistComplete,
        specialistId,
        status,
        toggleActionPoint,
      }}
    >
      {children}
    </DeliveryDraftContext.Provider>
  );
}
