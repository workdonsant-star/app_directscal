import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isAuthorizedManualActionPointCron } from "@/lib/data/manual-action-point-cron-auth";

const secret = "a".repeat(64);
const timestamp = "1793894400";
const signature = createHmac("sha256", secret).update(`manual-action-points:${timestamp}`).digest("hex");
const headers = new Headers({ "x-directscal-cron-timestamp": timestamp, "x-directscal-cron-signature": signature });

describe("autorização do cron de Action Points", () => {
  it("aceita a assinatura recente", () => expect(isAuthorizedManualActionPointCron(headers, secret, 1793894400_000)).toBe(true));
  it("recusa assinatura, segredo ou horário incorretos", () => {
    expect(isAuthorizedManualActionPointCron(headers, "b".repeat(64), 1793894400_000)).toBe(false);
    expect(isAuthorizedManualActionPointCron(headers, secret, 1793895001_000)).toBe(false);
    expect(isAuthorizedManualActionPointCron(new Headers(), secret, 1793894400_000)).toBe(false);
  });
});
