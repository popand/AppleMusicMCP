import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadVercelConfig } from "../src/config-vercel.js";
import { generateDeveloperTokenJose } from "../src/auth/developer-token-jose.js";

// Cache developer token across warm invocations
let cachedDevToken: string | null = null;
let tokenExpiry = 0;

async function getDeveloperToken(): Promise<string> {
  const now = Date.now();
  if (cachedDevToken && now < tokenExpiry) {
    return cachedDevToken;
  }
  const config = loadVercelConfig();
  cachedDevToken = await generateDeveloperTokenJose(
    config.teamId,
    config.keyId,
    config.privateKeyPem
  );
  tokenExpiry = now + 23 * 60 * 60 * 1000;
  return cachedDevToken;
}

export default {
  async fetch(_request: Request): Promise<Response> {
    try {
      const devToken = await getDeveloperToken();

      // Read the static HTML and inject the developer token as a meta tag
      const htmlPath = join(process.cwd(), "public", "auth.html");
      let html = readFileSync(htmlPath, "utf8");
      html = html.replace(
        "</head>",
        `  <meta name="developer-token" content="${devToken}">\n</head>`
      );

      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (err: unknown) {
      return new Response(`Auth page error: ${String(err)}`, { status: 500 });
    }
  },
};
