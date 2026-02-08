import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AppleMusicClient } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import type { AppleMusicResponse, Playlist } from "../api/types.js";
import { formatError } from "../utils/errors.js";

export function registerCreatePlaylist(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "create_playlist",
    "Create a new playlist in the user's Apple Music library",
    {
      name: z.string().describe("Name of the playlist"),
      description: z
        .string()
        .optional()
        .describe("Description of the playlist"),
      track_ids: z
        .array(z.string())
        .optional()
        .describe(
          "Array of catalog song IDs to add to the new playlist (from search_music)"
        ),
    },
    async ({ name, description, track_ids }) => {
      try {
        const body: Record<string, unknown> = {
          attributes: {
            name,
            ...(description && { description }),
          },
        };

        if (track_ids?.length) {
          body.relationships = {
            tracks: {
              data: track_ids.map((id) => ({ id, type: "songs" })),
            },
          };
        }

        const response = await client.request<
          AppleMusicResponse<Playlist>
        >(endpoints.libraryPlaylists(), {
          method: "POST",
          body,
          requiresUserToken: true,
        });

        // Invalidate playlist cache
        client.cache.invalidatePattern(/\/me\/library\/playlists/);

        const created = response.data[0];
        const lines = [
          `Playlist created successfully!`,
          `- **Name:** ${created.attributes.name}`,
          `- **ID:** ${created.id}`,
        ];

        if (track_ids?.length) {
          lines.push(`- **Tracks added:** ${track_ids.length}`);
        }

        lines.push(
          `\nYou can add more tracks with the add_tracks_to_playlist tool using playlist ID: ${created.id}`
        );

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
