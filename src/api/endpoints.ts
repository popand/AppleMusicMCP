const BASE_URL = "https://api.music.apple.com/v1";

export const endpoints = {
  // Catalog endpoints (developer token only)
  catalogSearch: (storefront: string) =>
    `${BASE_URL}/catalog/${storefront}/search`,

  catalogSong: (storefront: string, id: string) =>
    `${BASE_URL}/catalog/${storefront}/songs/${id}`,

  catalogAlbum: (storefront: string, id: string) =>
    `${BASE_URL}/catalog/${storefront}/albums/${id}`,

  catalogPlaylist: (storefront: string, id: string) =>
    `${BASE_URL}/catalog/${storefront}/playlists/${id}`,

  catalogArtist: (storefront: string, id: string) =>
    `${BASE_URL}/catalog/${storefront}/artists/${id}`,

  // Library endpoints (both tokens required)
  libraryPlaylists: () => `${BASE_URL}/me/library/playlists`,

  libraryPlaylist: (id: string) => `${BASE_URL}/me/library/playlists/${id}`,

  libraryPlaylistTracks: (id: string) =>
    `${BASE_URL}/me/library/playlists/${id}/tracks`,

  librarySongs: () => `${BASE_URL}/me/library/songs`,

  recentlyPlayed: () => `${BASE_URL}/me/recent/played/tracks`,

  recommendations: () => `${BASE_URL}/me/recommendations`,
} as const;
