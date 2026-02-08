import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AppleMusicClient } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import { AppleMusicApiError, formatError } from "../utils/errors.js";

export function registerRemoveTracks(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "remove_tracks_from_playlist",
    "Remove tracks from a playlist. Note: Apple Music API has limited support for track removal - this may not work for all playlist types.",
    {
      playlist_id: z
        .string()
        .describe("The playlist ID (from get_user_playlists)"),
      track_ids: z
        .array(z.string())
        .min(1)
        .describe("Array of song IDs to remove from the playlist"),
    },
    async ({ playlist_id, track_ids }) => {
      try {
        const body = {
          data: track_ids.map((id) => ({ id, type: "songs" })),
        };

        await client.request(
          endpoints.libraryPlaylistTracks(playlist_id),
          {
            method: "DELETE",
            body,
            requiresUserToken: true,
          }
        );

        // Invalidate playlist tracks cache
        client.cache.invalidatePattern(
          new RegExp(`/me/library/playlists/${playlist_id}`)
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully removed ${track_ids.length} track(s) from playlist ${playlist_id}.`,
            },
          ],
        };
      } catch (error) {
        // Apple Music API may not support DELETE for playlist tracks
        if (
          error instanceof AppleMusicApiError &&
          [405, 404, 403].includes(error.statusCode)
        ) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  "Apple Music API does not support removing individual tracks from this playlist " +
                  "via the REST API. This is a known limitation.\n\n" +
                  "**Workaround:** Create a new playlist with only the tracks you want to keep:\n" +
                  "1. Use `get_playlist_tracks` to list all current tracks\n" +
                  "2. Use `create_playlist` with the desired track IDs",
              },
            ],
            isError: true,
          };
        }
        return formatError(error);
      }
    }
  );
}
