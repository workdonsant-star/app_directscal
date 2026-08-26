import { describe, expect, it } from "vitest";

import { calculateLatestVsPreviousComparison } from "@/lib/data/omdx-overview-analytics";

describe("dimension insight comparisons", () => {
  it("compares the latest diagnostic with the average of all previous diagnostics", () => {
    expect(
      calculateLatestVsPreviousComparison([
        { createdAt: "2026-03-01T00:00:00.000Z", value: 3 },
        { createdAt: "2026-01-01T00:00:00.000Z", value: 2 },
        { createdAt: "2026-02-01T00:00:00.000Z", value: 4 },
      ]),
    ).toEqual({
      latest: 3,
      percentage: 0,
      previousAverage: 3,
    });
  });

  it("returns a signed percentage and ignores the input order", () => {
    expect(
      calculateLatestVsPreviousComparison([
        { createdAt: "2026-05-01T00:00:00.000Z", value: 4.5 },
        { createdAt: "2026-03-01T00:00:00.000Z", value: 3 },
        { createdAt: "2026-04-01T00:00:00.000Z", value: 3 },
      ]),
    ).toEqual({
      latest: 4.5,
      percentage: 50,
      previousAverage: 3,
    });
  });

  it("returns a negative percentage when the latest gap is lower", () => {
    expect(
      calculateLatestVsPreviousComparison([
        { createdAt: "2026-03-01T00:00:00.000Z", value: 1.5 },
        { createdAt: "2026-04-01T00:00:00.000Z", value: 1 },
        { createdAt: "2026-05-01T00:00:00.000Z", value: 0.5 },
      ]),
    ).toEqual({
      latest: 0.5,
      percentage: -60,
      previousAverage: 1.25,
    });
  });

  it("does not compare a single diagnostic or a zero baseline", () => {
    expect(
      calculateLatestVsPreviousComparison([
        { createdAt: "2026-05-01T00:00:00.000Z", value: 4 },
      ]),
    ).toBeNull();

    expect(
      calculateLatestVsPreviousComparison([
        { createdAt: "2026-04-01T00:00:00.000Z", value: 0 },
        { createdAt: "2026-05-01T00:00:00.000Z", value: 4 },
      ]),
    ).toBeNull();
  });
});
