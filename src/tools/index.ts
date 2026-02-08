import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AppleMusicClient } from "../api/client.js";
import { registerSearchMusic } from "./search-music.js";
import { registerGetUserPlaylists } from "./get-user-playlists.js";
import { registerGetPlaylistTracks } from "./get-playlist-tracks.js";
import { registerCreatePlaylist } from "./create-playlist.js";
import { registerAddTracks } from "./add-tracks.js";
import { registerRemoveTracks } from "./remove-tracks.js";
import { registerGetLibrarySongs } from "./get-library-songs.js";
import { registerGetRecentlyPlayed } from "./get-recently-played.js";
import { registerGetRecommendations } from "./get-recommendations.js";

export function registerAllTools(
  server: McpServer,
  client: AppleMusicClient
): void {
  registerSearchMusic(server, client);
  registerGetUserPlaylists(server, client);
  registerGetPlaylistTracks(server, client);
  registerCreatePlaylist(server, client);
  registerAddTracks(server, client);
  registerRemoveTracks(server, client);
  registerGetLibrarySongs(server, client);
  registerGetRecentlyPlayed(server, client);
  registerGetRecommendations(server, client);
}
