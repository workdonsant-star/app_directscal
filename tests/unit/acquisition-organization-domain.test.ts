import { describe, expect, it } from "vitest";

import { getAcquisitionOrganizationDomain } from "@/lib/data/acquisition-data-source";

describe("getAcquisitionOrganizationDomain", () => {
  it("does not group personal e-mail accounts into one organization", () => {
    expect(getAcquisitionOrganizationDomain("cliente@gmail.com")).toBeNull();
    expect(getAcquisitionOrganizationDomain("cliente@outlook.com")).toBeNull();
  });

  it("keeps corporate domains available for organization matching", () => {
    expect(
      getAcquisitionOrganizationDomain("cliente@shippingcaps.com.br"),
    ).toBe("shippingcaps.com.br");
  });
});
