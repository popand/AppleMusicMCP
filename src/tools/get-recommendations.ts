import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AppleMusicClient } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import type { AppleMusicResponse, Recommendation } from "../api/types.js";
import { formatError } from "../utils/errors.js";

export function registerGetRecommendations(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "get_recommendations",
    "Get personalized music recommendations from Apple Music based on listening history",
    {
      limit: z
        .number()
        .min(1)
        .max(30)
        .optional()
        .default(10)
        .describe("Maximum number of recommendation groups to return"),
    },
    async ({ limit }) => {
      try {
        const response = await client.request<
          AppleMusicResponse<Recommendation>
        >(endpoints.recommendations(), {
          params: { limit },
          requiresUserToken: true,
          cacheTtlMs: 10 * 60 * 1000, // 10 minutes
        });

        if (!response.data.length) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No recommendations available.",
              },
            ],
          };
        }

        const lines: string[] = ["## Personalized Recommendations\n"];

        for (const rec of response.data) {
          const title = rec.attributes.title.stringForDisplay;
          const reason = rec.attributes.reason?.stringForDisplay;

          lines.push(`### ${title}`);
          if (reason) {
            lines.push(`*${reason}*\n`);
          }

          const contents = rec.relationships?.contents?.data;
          if (contents?.length) {
            for (const item of contents) {
              const attrs = item.attributes as Record<string, unknown>;
              const name = (attrs?.name as string) || "Unknown";
              const type = item.type;

              if (type === "albums" || type === "library-albums") {
                const artistName =
                  (attrs?.artistName as string) || "Unknown Artist";
                lines.push(
                  `- Album: **${name}** by ${artistName} [ID: ${item.id}]`
                );
              } else if (type === "playlists" || type === "library-playlists") {
                lines.push(`- Playlist: **${name}** [ID: ${item.id}]`);
              } else if (type === "songs" || type === "library-songs") {
                const artistName =
                  (attrs?.artistName as string) || "Unknown Artist";
                lines.push(
                  `- Song: **${name}** by ${artistName} [ID: ${item.id}]`
                );
              } else {
                lines.push(`- ${type}: **${name}** [ID: ${item.id}]`);
              }
            }
          }

          lines.push("");
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
