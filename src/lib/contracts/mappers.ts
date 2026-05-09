import type {
  DbDiagnostic,
  DbOrganization,
  Diagnostic,
  Organization,
} from "./omdx";
import type { DbUserProfile, UserProfile } from "./profile";

export function mapDbOrganizationToOrganization(
  organization: DbOrganization,
): Organization {
  return {
    id: organization.id,
    name: organization.name,
    employeeCount: organization.employee_count,
    createdAt: organization.created_at,
    updatedAt: organization.updated_at,
  };
}

export function mapDbDiagnosticToDiagnostic(
  diagnostic: DbDiagnostic,
  organization: Organization,
): Diagnostic {
  return {
    id: diagnostic.id,
    organizationId: diagnostic.organization_id,
    organizationName: organization.name,
    company: organization.name,
    name: diagnostic.name,
    description: diagnostic.description,
    templateId: diagnostic.template_id,
    status: diagnostic.status,
    createdAt: diagnostic.created_at,
    updatedAt: diagnostic.updated_at,
    activatedAt: diagnostic.activated_at,
    closedAt: diagnostic.closed_at,
    deadline: diagnostic.deadline,
    responses: {
      total: diagnostic.responses_total,
      fundador: diagnostic.responses_fundador,
      lideranca: diagnostic.responses_lideranca,
      operacao: diagnostic.responses_operacao,
    },
    generalScore: diagnostic.general_score,
  };
}

export function mapDbUserProfileToUserProfile(
  user: DbUserProfile,
  organization: Organization,
): UserProfile {
  return {
    id: user.id,
    organizationId: organization.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    company: organization.name,
    employeeCount: organization.employeeCount,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
