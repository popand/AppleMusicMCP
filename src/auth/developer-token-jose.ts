import { SignJWT, importPKCS8 } from "jose";

export async function generateDeveloperTokenJose(
  teamId: string,
  keyId: string,
  privateKeyPem: string
): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, "ES256");

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 180 * 24 * 60 * 60; // 180 days max

  return new SignJWT({ iss: teamId, iat: now, exp })
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .sign(privateKey);
}
