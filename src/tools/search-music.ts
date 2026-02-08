import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AppleMusicClient } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import type { SearchResponse } from "../api/types.js";
import { formatError } from "../utils/errors.js";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function registerSearchMusic(
  server: McpServer,
  client: AppleMusicClient
): void {
  server.tool(
    "search_music",
    "Search the Apple Music catalog for songs, albums, artists, and playlists",
    {
      query: z
        .string()
        .describe("Search term (artist name, song title, album name, etc.)"),
      types: z
        .array(z.enum(["songs", "albums", "artists", "playlists"]))
        .optional()
        .default(["songs", "albums", "artists"])
        .describe("Types of results to return"),
      limit: z
        .number()
        .min(1)
        .max(25)
        .optional()
        .default(10)
        .describe("Maximum results per type (1-25)"),
      storefront: z
        .string()
        .optional()
        .describe(
          "ISO 3166 alpha-2 country code (default: configured storefront)"
        ),
    },
    async ({ query, types, limit, storefront }) => {
      try {
        const sf = storefront || client.defaultStorefront;
        const response = await client.request<SearchResponse>(
          endpoints.catalogSearch(sf),
          {
            params: {
              term: query,
              types: types!.join(","),
              limit,
            },
            cacheTtlMs: 5 * 60 * 1000,
          }
        );

        const results: string[] = [];
        const { results: searchResults } = response;

        if (searchResults.songs?.data.length) {
          results.push("## Songs");
          for (const song of searchResults.songs.data) {
            results.push(
              `- **${song.attributes.name}** by ${song.attributes.artistName}` +
                ` (${song.attributes.albumName}, ${formatDuration(song.attributes.durationInMillis)})` +
                ` [ID: ${song.id}]`
            );
          }
        }

        if (searchResults.albums?.data.length) {
          results.push("\n## Albums");
          for (const album of searchResults.albums.data) {
            results.push(
              `- **${album.attributes.name}** by ${album.attributes.artistName}` +
                ` (${album.attributes.trackCount} tracks` +
                (album.attributes.releaseDate
                  ? `, ${album.attributes.releaseDate}`
                  : "") +
                `)` +
                ` [ID: ${album.id}]`
            );
          }
        }

        if (searchResults.artists?.data.length) {
          results.push("\n## Artists");
          for (const artist of searchResults.artists.data) {
            results.push(
              `- **${artist.attributes.name}**` +
                (artist.attributes.genreNames?.length
                  ? ` (${artist.attributes.genreNames.join(", ")})`
                  : "") +
                ` [ID: ${artist.id}]`
            );
          }
        }

        if (searchResults.playlists?.data.length) {
          results.push("\n## Playlists");
          for (const playlist of searchResults.playlists.data) {
            results.push(
              `- **${playlist.attributes.name}**` +
                ` [ID: ${playlist.id}]`
            );
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: results.length ? results.join("\n") : "No results found.",
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
