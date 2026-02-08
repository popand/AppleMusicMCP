#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { generateDeveloperToken } from "./auth/developer-token.js";
import { TokenStore } from "./auth/token-store.js";
import { obtainUserToken } from "./auth/user-token.js";
import { AppleMusicClient } from "./api/client.js";
import { registerAllTools } from "./tools/index.js";
import { logger } from "./utils/logger.js";

async function runAuthFlow(): Promise<void> {
  logger.info("Starting Music User Token authorization flow...");
  const config = loadConfig();
  const developerToken = generateDeveloperToken(
    config.teamId,
    config.keyId,
    config.privateKeyPath
  );

  const tokenStore = new TokenStore(config.configDir);
  tokenStore.setDeveloperToken(developerToken);

  const userToken = await obtainUserToken(developerToken, config.authPort);
  tokenStore.setMusicUserToken(userToken);
  logger.info("Music User Token saved successfully!");
  logger.info(
    "You can now start the MCP server. Library features are enabled."
  );
}

async function runServer(): Promise<void> {
  const config = loadConfig();
  const tokenStore = new TokenStore(config.configDir);

  // Generate or load developer token
  let developerToken = tokenStore.getDeveloperToken();
  if (!developerToken || tokenStore.isDeveloperTokenExpired()) {
    logger.info("Generating new developer token...");
    developerToken = generateDeveloperToken(
      config.teamId,
      config.keyId,
      config.privateKeyPath
    );
    tokenStore.setDeveloperToken(developerToken);
  }

  // Check Music User Token status
  if (!tokenStore.getMusicUserToken()) {
    logger.warn(
      "No Music User Token found. Library/playlist tools will be unavailable. " +
        "Run with 'auth' argument to authorize: node dist/index.js auth"
    );
  } else if (tokenStore.isUserTokenExpired()) {
    logger.warn(
      "Music User Token may be expired. Re-authorize if library calls fail: " +
        "node dist/index.js auth"
    );
  }

  const client = new AppleMusicClient(
    tokenStore,
    developerToken,
    config.storefront
  );

  const server = new McpServer({
    name: "apple-music",
    version: "1.0.0",
  });

  registerAllTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Apple Music MCP server started");
}

async function main(): Promise<void> {
  if (process.argv[2] === "auth") {
    await runAuthFlow();
    process.exit(0);
  }

  await runServer();
}

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
