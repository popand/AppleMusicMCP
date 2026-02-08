import { ConfigurationError } from "./utils/errors.js";

export interface AppleMusicConfig {
  teamId: string;
  keyId: string;
  privateKeyPath: string;
  storefront: string;
  configDir: string;
  authPort: number;
}

export function loadConfig(): AppleMusicConfig {
  const teamId = process.env.APPLE_MUSIC_TEAM_ID;
  const keyId = process.env.APPLE_MUSIC_KEY_ID;
  const privateKeyPath = process.env.APPLE_MUSIC_PRIVATE_KEY_PATH;

  if (!teamId) {
    throw new ConfigurationError(
      "APPLE_MUSIC_TEAM_ID environment variable is required. " +
        "Set it to your Apple Developer Team ID."
    );
  }

  if (!keyId) {
    throw new ConfigurationError(
      "APPLE_MUSIC_KEY_ID environment variable is required. " +
        "Set it to your MusicKit Key ID from the Apple Developer Portal."
    );
  }

  if (!privateKeyPath) {
    throw new ConfigurationError(
      "APPLE_MUSIC_PRIVATE_KEY_PATH environment variable is required. " +
        "Set it to the path of your MusicKit .p8 private key file."
    );
  }

  const storefront = process.env.APPLE_MUSIC_STOREFRONT || "us";
  const configDir =
    process.env.APPLE_MUSIC_CONFIG_DIR ||
    `${process.env.HOME}/.apple-music-mcp`;
  const authPort = parseInt(process.env.APPLE_MUSIC_AUTH_PORT || "7829", 10);

  return {
    teamId,
    keyId,
    privateKeyPath,
    storefront,
    configDir,
    authPort,
  };
}
