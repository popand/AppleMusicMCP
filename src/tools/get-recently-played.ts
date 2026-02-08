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

export function registerGetRecentlyPlayed(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "get_recently_played",
    "Get the user's recently played tracks on Apple Music (up to 10 per request, 50 total with pagination)",
    {
      limit: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(10)
        .describe(
          "Maximum number of tracks to return (1-10, API maximum is 10 per request)"
        ),
    },
    async ({ limit }) => {
      try {
        const response = await client.request<AppleMusicResponse<Song>>(
          endpoints.recentlyPlayed(),
          {
            params: { limit },
            requiresUserToken: true,
            cacheTtlMs: 60 * 1000, // 1 minute - recently played changes frequently
          }
        );

        if (!response.data.length) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No recently played tracks found.",
              },
            ],
          };
        }

        const lines: string[] = ["## Recently Played\n"];
        response.data.forEach((song, i) => {
          const attrs = song.attributes;
          lines.push(
            `${i + 1}. **${attrs.name}** by ${attrs.artistName}` +
              ` (${attrs.albumName}, ${formatDuration(attrs.durationInMillis)})` +
              ` [ID: ${song.id}]`
          );
        });

        if (response.next) {
          lines.push(
            "\n*Note: Apple Music API provides up to 50 recently played tracks total.*"
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
