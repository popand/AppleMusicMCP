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

export function registerGetPlaylistTracks(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "get_playlist_tracks",
    "Get the tracks in a specific playlist from the user's library",
    {
      playlist_id: z
        .string()
        .describe("The playlist ID (from get_user_playlists)"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(100)
        .describe("Maximum number of tracks to return (1-100)"),
      offset: z
        .number()
        .min(0)
        .optional()
        .default(0)
        .describe("Offset for pagination"),
    },
    async ({ playlist_id, limit, offset }) => {
      try {
        const response = await client.request<AppleMusicResponse<Song>>(
          endpoints.libraryPlaylistTracks(playlist_id),
          {
            params: { limit, offset },
            requiresUserToken: true,
            cacheTtlMs: 2 * 60 * 1000,
          }
        );

        if (!response.data.length) {
          return {
            content: [
              {
                type: "text" as const,
                text: "This playlist has no tracks.",
              },
            ],
          };
        }

        const lines: string[] = ["## Playlist Tracks\n"];
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
            `\n*More tracks available. Use offset=${offset + limit} to see the next page.*`
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
