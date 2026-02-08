import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AppleMusicClient } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import type { AppleMusicResponse, Playlist } from "../api/types.js";
import { formatError } from "../utils/errors.js";

export function registerGetUserPlaylists(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "get_user_playlists",
    "List all playlists from the user's Apple Music library",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(25)
        .describe("Maximum number of playlists to return (1-100)"),
      offset: z
        .number()
        .min(0)
        .optional()
        .default(0)
        .describe("Offset for pagination"),
    },
    async ({ limit, offset }) => {
      try {
        const response = await client.request<
          AppleMusicResponse<Playlist>
        >(endpoints.libraryPlaylists(), {
          params: { limit, offset },
          requiresUserToken: true,
          cacheTtlMs: 2 * 60 * 1000,
        });

        if (!response.data.length) {
          return {
            content: [
              { type: "text" as const, text: "No playlists found in your library." },
            ],
          };
        }

        const lines: string[] = ["## Your Playlists\n"];
        for (const playlist of response.data) {
          const attrs = playlist.attributes;
          const editable = attrs.canEdit ? "editable" : "read-only";
          const desc = attrs.description?.standard
            ? ` - ${attrs.description.standard}`
            : "";
          lines.push(
            `- **${attrs.name}** (${editable})${desc} [ID: ${playlist.id}]`
          );
        }

        if (response.next) {
          lines.push(
            `\n*More playlists available. Use offset=${offset + limit} to see the next page.*`
          );
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
