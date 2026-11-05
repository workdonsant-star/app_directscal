import { createHmac, timingSafeEqual } from "node:crypto";

export function isAuthorizedManualActionPointCron(headers: Headers, secret: string | undefined, now = Date.now()): boolean {
  const timestamp = headers.get("x-directscal-cron-timestamp") ?? "";
  const signature = headers.get("x-directscal-cron-signature") ?? "";
  if (!secret || secret.length < 32 || !/^\d{10}$/.test(timestamp) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  if (Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 600) return false;
  const expected = createHmac("sha256", secret).update(`manual-action-points:${timestamp}`).digest("hex");
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}
