import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { loadVercelConfig } from "../src/config-vercel.js";
import { generateDeveloperTokenJose } from "../src/auth/developer-token-jose.js";
import { AppleMusicClient } from "../src/api/client.js";
import { TokenStore } from "../src/auth/token-store.js";
import { registerAllTools } from "../src/tools/index.js";

// Cache developer token across warm invocations (same Vercel container)
let cachedDevToken: string | null = null;
let tokenExpiry = 0;

async function getDeveloperToken(
  teamId: string,
  keyId: string,
  privateKeyPem: string
): Promise<string> {
  const now = Date.now();
  if (cachedDevToken && now < tokenExpiry) {
    return cachedDevToken;
  }
  cachedDevToken = await generateDeveloperTokenJose(teamId, keyId, privateKeyPem);
  tokenExpiry = now + 23 * 60 * 60 * 1000; // regenerate every 23 hours
  return cachedDevToken;
}

function createEnvTokenStore(
  devToken: string,
  userToken?: string
): TokenStore {
  return {
    getDeveloperToken: () => devToken,
    getMusicUserToken: () => userToken,
    isDeveloperTokenExpired: () => false,
    isUserTokenExpired: () => false,
    setDeveloperToken: () => {},
    setMusicUserToken: () => {},
  } as unknown as TokenStore;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Music-User-Token, mcp-session-id, Last-Event-ID, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

async function handleMcpRequest(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Bearer token auth
  const apiKey = process.env.MCP_API_KEY;
  if (apiKey) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${apiKey}`) {
      return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
    }
  }

  const config = loadVercelConfig();
  const devToken = await getDeveloperToken(
    config.teamId,
    config.keyId,
    config.privateKeyPem
  );

  // User token: prefer request header, fall back to env var
  const musicUserToken =
    request.headers.get("Music-User-Token") || config.musicUserToken;

  const tokenStore = createEnvTokenStore(devToken, musicUserToken);
  const client = new AppleMusicClient(tokenStore, devToken, config.storefront);

  const server = new McpServer({
    name: "apple-music-remote",
    version: "1.0.0",
  });

  registerAllTools(server, client);

  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);

  const response = await transport.handleRequest(request);

  // Add CORS headers to the response
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Vercel Web Standard fetch export
export default {
  fetch: handleMcpRequest,
};
