import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AppleMusicClient } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import { formatError } from "../utils/errors.js";

export function registerAddTracks(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "add_tracks_to_playlist",
    "Add tracks to an existing playlist in the user's Apple Music library",
    {
      playlist_id: z
        .string()
        .describe("The playlist ID (from get_user_playlists)"),
      track_ids: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of catalog song IDs to add (from search_music). Max 100 per request."
        ),
    },
    async ({ playlist_id, track_ids }) => {
      try {
        const body = {
          data: track_ids.map((id) => ({ id, type: "songs" })),
        };

        await client.request(
          endpoints.libraryPlaylistTracks(playlist_id),
          {
            method: "POST",
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
              text: `Successfully added ${track_ids.length} track(s) to playlist ${playlist_id}.`,
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
