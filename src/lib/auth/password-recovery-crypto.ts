import "server-only";
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";
import { z } from "zod";
const sealedSchema = z.object({ iv: z.string(), ciphertext: z.string(), tag: z.string(), url: z.url() }).strict();
function key() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Recuperação indisponível.");
  return Buffer.from(hkdfSync("sha256", secret, "directscal-password-recovery", "outbox-v1", 32));
}
export function hashRecoveryToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function createRecoveryToken(id: string) { return `${id}.${randomBytes(32).toString("base64url")}`; }
export function sealRecoveryToken(id: string, token: string, url: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(JSON.stringify([id, url])));
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return { iv: iv.toString("base64url"), ciphertext: ciphertext.toString("base64url"), tag: cipher.getAuthTag().toString("base64url"), url };
}
export function openRecoveryToken(id: string, raw: unknown) {
  const sealed = sealedSchema.parse(raw);
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(sealed.iv, "base64url"));
  decipher.setAAD(Buffer.from(JSON.stringify([id, sealed.url]))); decipher.setAuthTag(Buffer.from(sealed.tag, "base64url"));
  return { token: Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, "base64url")), decipher.final()]).toString("utf8"), url: sealed.url };
}
