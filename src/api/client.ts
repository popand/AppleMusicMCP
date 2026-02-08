import { TokenStore } from "../auth/token-store.js";
import type { AppleMusicErrorResponse } from "./types.js";
import { logger } from "../utils/logger.js";
import { Cache } from "../cache/cache.js";
import {
  AppleMusicApiError,
  AuthenticationError,
} from "../utils/errors.js";

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  requiresUserToken?: boolean;
  cacheTtlMs?: number;
}

export class AppleMusicClient {
  private tokenStore: TokenStore;
  public cache: Cache;
  private developerToken: string;
  private storefront: string;

  constructor(
    tokenStore: TokenStore,
    developerToken: string,
    storefront: string
  ) {
    this.tokenStore = tokenStore;
    this.cache = new Cache();
    this.developerToken = developerToken;
    this.storefront = storefront;
  }

  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = "GET",
      body,
      params,
      requiresUserToken = false,
      cacheTtlMs = 0,
    } = options;

    const fullUrl = new URL(url);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          fullUrl.searchParams.set(key, String(value));
        }
      }
    }

    const cacheKey = fullUrl.toString();
    if (method === "GET" && cacheTtlMs > 0) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.developerToken}`,
      "Content-Type": "application/json",
    };

    if (requiresUserToken) {
      const userToken = this.tokenStore.getMusicUserToken();
      if (!userToken) {
        throw new AuthenticationError(
          "Music User Token required. Run the server with 'auth' argument to authorize: " +
            "node dist/index.js auth"
        );
      }
      headers["Music-User-Token"] = userToken;
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(fullUrl.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const delayMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, attempt + 1) * 1000;
        logger.warn(
          `Rate limited (attempt ${attempt + 1}/3), retrying in ${delayMs}ms`
        );
        await this.sleep(delayMs);
        continue;
      }

      if (response.status === 401) {
        throw new AuthenticationError(
          "Authentication failed (401). Developer token may be expired or invalid."
        );
      }

      if (response.status === 403) {
        throw new AuthenticationError(
          "Access forbidden (403). Music User Token may be expired or invalid. " +
            "Re-authorize with: node dist/index.js auth"
        );
      }

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errorBody =
            (await response.json()) as AppleMusicErrorResponse;
          if (errorBody.errors?.length) {
            errorDetail = errorBody.errors[0].detail || errorDetail;
            throw new AppleMusicApiError(
              errorDetail,
              response.status,
              errorBody.errors
            );
          }
        } catch (e) {
          if (e instanceof AppleMusicApiError) throw e;
        }
        throw new AppleMusicApiError(errorDetail, response.status);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const data = (await response.json()) as T;

      if (method === "GET" && cacheTtlMs > 0) {
        this.cache.set(cacheKey, data, cacheTtlMs);
      }

      return data;
    }

    throw new AppleMusicApiError("Request failed after 3 retries (rate limited)", 429);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  get defaultStorefront(): string {
    return this.storefront;
  }
}
