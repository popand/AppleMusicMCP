import { ConfigurationError } from "./utils/errors.js";

export interface VercelAppleMusicConfig {
  teamId: string;
  keyId: string;
  privateKeyPem: string;
  storefront: string;
  musicUserToken?: string;
}

export function loadVercelConfig(): VercelAppleMusicConfig {
  const teamId = process.env.APPLE_MUSIC_TEAM_ID;
  const keyId = process.env.APPLE_MUSIC_KEY_ID;
  const privateKeyBase64 = process.env.APPLE_MUSIC_PRIVATE_KEY;
  const musicUserToken = process.env.APPLE_MUSIC_USER_TOKEN;

  if (!teamId) {
    throw new ConfigurationError(
      "APPLE_MUSIC_TEAM_ID environment variable is required."
    );
  }

  if (!keyId) {
    throw new ConfigurationError(
      "APPLE_MUSIC_KEY_ID environment variable is required."
    );
  }

  if (!privateKeyBase64) {
    throw new ConfigurationError(
      "APPLE_MUSIC_PRIVATE_KEY environment variable is required (base64-encoded .p8 key)."
    );
  }

  const privateKeyPem = Buffer.from(privateKeyBase64, "base64").toString("utf8");

  return {
    teamId,
    keyId,
    privateKeyPem,
    storefront: process.env.APPLE_MUSIC_STOREFRONT || "us",
    musicUserToken,
  };
}
