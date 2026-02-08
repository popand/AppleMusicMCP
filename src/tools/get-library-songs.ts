import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AppleMusicClient } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import type { AppleMusicResponse, Song } from "../api/types.js";
import { formatError } from "../utils/errors.js";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function registerGetLibrarySongs(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "get_library_songs",
    "Get songs from the user's Apple Music library",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(25)
        .describe("Maximum number of songs to return (1-100)"),
      offset: z
        .number()
        .min(0)
        .optional()
        .default(0)
        .describe("Offset for pagination"),
    },
    async ({ limit, offset }) => {
      try {
        const response = await client.request<AppleMusicResponse<Song>>(
          endpoints.librarySongs(),
          {
            params: { limit, offset },
            requiresUserToken: true,
            cacheTtlMs: 5 * 60 * 1000,
          }
        );

        if (!response.data.length) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No songs found in your library.",
              },
            ],
          };
        }

        const lines: string[] = ["## Library Songs\n"];
        response.data.forEach((song, i) => {
          const attrs = song.attributes;
          const num = offset + i + 1;
          lines.push(
            `${num}. **${attrs.name}** by ${attrs.artistName}` +
              ` (${attrs.albumName}, ${formatDuration(attrs.durationInMillis)})` +
              ` [ID: ${song.id}]`
          );
        });

        if (response.next) {
          lines.push(
            `\n*More songs available. Use offset=${offset + limit} to see the next page.*`
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
