import jwt from "jsonwebtoken";
import { readFileSync } from "node:fs";

export function generateDeveloperToken(
  teamId: string,
  keyId: string,
  privateKeyPath: string
): string {
  const privateKey = readFileSync(privateKeyPath, "utf8");

  const now = Math.floor(Date.now() / 1000);
  const expiration = now + 180 * 24 * 60 * 60; // 180 days (max allowed by Apple)

  return jwt.sign(
    {
      iss: teamId,
      iat: now,
      exp: expiration,
    },
    privateKey,
    {
      algorithm: "ES256",
      header: {
        alg: "ES256",
        kid: keyId,
      },
    }
  );
}
