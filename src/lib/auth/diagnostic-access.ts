export type DiagnosticViewerRole = "superadmin" | "admin" | "cliente";

type DiagnosticAccessInput = {
  assignedToViewer: boolean;
  creatorUserId: string | null;
  viewerRole: DiagnosticViewerRole | null;
  viewerUserId: string;
};

export function getDiagnosticAccessDecision({
  assignedToViewer,
  creatorUserId,
  viewerRole,
  viewerUserId,
}: DiagnosticAccessInput) {
  const isCompanyOwner = viewerRole === "cliente";
  const isCreator = creatorUserId === viewerUserId;
  const isLegacyVisible = creatorUserId === null && viewerRole !== null;
  const canManage = isCompanyOwner || isCreator;

  return {
    canManage,
    canView:
      canManage ||
      assignedToViewer ||
      (isLegacyVisible && viewerRole !== "superadmin"),
    canViewAllTeamLinks: canManage,
    canViewFounderLink: isCompanyOwner,
  };
}
