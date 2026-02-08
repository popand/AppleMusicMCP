import http from "node:http";
import { readFileSync } from "node:fs";
import open from "open";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function obtainUserToken(
  developerToken: string,
  port: number = 7829
): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method === "GET" && req.url === "/auth") {
        const htmlPath = path.join(__dirname, "../auth-page/index.html");
        let html: string;
        try {
          html = readFileSync(htmlPath, "utf8");
        } catch {
          // In compiled mode, the HTML file is relative to dist/
          const altPath = path.join(__dirname, "../auth-page/index.html");
          html = readFileSync(altPath, "utf8");
        }
        html = html.replace("{{DEVELOPER_TOKEN}}", developerToken);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
        return;
      }

      if (req.method === "POST" && req.url === "/callback") {
        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const { musicUserToken } = JSON.parse(body);
            if (!musicUserToken) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Missing musicUserToken" }));
              return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));

            server.close();
            clearTimeout(timeout);
            resolve(musicUserToken);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 5 minutes"));
    }, 5 * 60 * 1000);

    server.listen(port, () => {
      const authUrl = `http://localhost:${port}/auth`;
      logger.info(`Authorization server running at ${authUrl}`);
      logger.info("Opening browser for Apple Music authorization...");
      open(authUrl);
    });

    server.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Auth server error: ${err.message}`));
    });
  });
}
