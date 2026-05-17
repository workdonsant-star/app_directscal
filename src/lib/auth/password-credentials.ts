import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const keyLength = 64;
const scryptParams = {
  N: 16_384,
  p: 1,
  r: 8,
};

export function hashPasswordCredential(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, keyLength, scryptParams).toString(
    "base64url",
  );

  return `scrypt$${scryptParams.N}$${scryptParams.r}$${scryptParams.p}$${salt}$${hash}`;
}

export function verifyPasswordCredential(password: string, encodedHash: string) {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHash] =
    encodedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const expected = Buffer.from(expectedHash, "base64url");
  const actual = scryptSync(password, salt, expected.length, {
    N: Number(cost),
    p: Number(parallelization),
    r: Number(blockSize),
  });

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
