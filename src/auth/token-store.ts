import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  chmodSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { logger } from "../utils/logger.js";

interface StoredTokens {
  developerToken?: string;
  developerTokenCreatedAt?: number;
  musicUserToken?: string;
  musicUserTokenCreatedAt?: number;
}

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), ".apple-music-mcp");
const TOKENS_FILE = "tokens.json";

// Refresh thresholds (170 days, leaving 10-day buffer before 180-day expiry)
const TOKEN_MAX_AGE_MS = 170 * 24 * 60 * 60 * 1000;

export class TokenStore {
  private filePath: string;
  private tokens: StoredTokens = {};

  constructor(configDir?: string) {
    const dir = configDir || DEFAULT_CONFIG_DIR;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.filePath = path.join(dir, TOKENS_FILE);
    this.load();
  }

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const data = readFileSync(this.filePath, "utf8");
        this.tokens = JSON.parse(data);
      }
    } catch (error) {
      logger.warn("Failed to load tokens file, starting fresh:", error);
      this.tokens = {};
    }
  }

  private save(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.tokens, null, 2), "utf8");
      chmodSync(this.filePath, 0o600);
    } catch (error) {
      logger.error("Failed to save tokens file:", error);
    }
  }

  getDeveloperToken(): string | undefined {
    return this.tokens.developerToken;
  }

  setDeveloperToken(token: string): void {
    this.tokens.developerToken = token;
    this.tokens.developerTokenCreatedAt = Date.now();
    this.save();
  }

  isDeveloperTokenExpired(): boolean {
    if (!this.tokens.developerTokenCreatedAt) return true;
    return Date.now() - this.tokens.developerTokenCreatedAt > TOKEN_MAX_AGE_MS;
  }

  getMusicUserToken(): string | undefined {
    return this.tokens.musicUserToken;
  }

  setMusicUserToken(token: string): void {
    this.tokens.musicUserToken = token;
    this.tokens.musicUserTokenCreatedAt = Date.now();
    this.save();
  }

  isUserTokenExpired(): boolean {
    if (!this.tokens.musicUserTokenCreatedAt) return true;
    return Date.now() - this.tokens.musicUserTokenCreatedAt > TOKEN_MAX_AGE_MS;
  }
}
