import type { ResponsesByGroup } from "@/lib/contracts";

export const minimumResponsesPerGroup = 3;

export function normalizeRespondentEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hasMinimumResponsesByGroup(
  responses: Pick<ResponsesByGroup, "fundador" | "lideranca" | "operacao">,
) {
  return (
    responses.fundador >= minimumResponsesPerGroup &&
    responses.lideranca >= minimumResponsesPerGroup &&
    responses.operacao >= minimumResponsesPerGroup
  );
}

export function getResponseCookieName(token: string) {
  return `directscal_omdx_response_${token}`;
}
