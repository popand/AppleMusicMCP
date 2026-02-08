export interface Artwork {
  width?: number;
  height?: number;
  url: string;
  bgColor?: string;
  textColor1?: string;
}

export interface AppleMusicResource {
  id: string;
  type: string;
  href?: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data: AppleMusicResource[] }>;
}

export interface Song extends AppleMusicResource {
  type: "songs" | "library-songs";
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    durationInMillis: number;
    trackNumber?: number;
    discNumber?: number;
    genreNames?: string[];
    releaseDate?: string;
    isrc?: string;
    artwork?: Artwork;
    url?: string;
    playParams?: { id: string; kind: string };
    previews?: { url: string }[];
  };
}

export interface Album extends AppleMusicResource {
  type: "albums" | "library-albums";
  attributes: {
    name: string;
    artistName: string;
    trackCount: number;
    releaseDate?: string;
    genreNames?: string[];
    artwork?: Artwork;
    url?: string;
    isSingle?: boolean;
    isComplete?: boolean;
  };
}

export interface Artist extends AppleMusicResource {
  type: "artists" | "library-artists";
  attributes: {
    name: string;
    genreNames?: string[];
    url?: string;
    artwork?: Artwork;
  };
}

export interface Playlist extends AppleMusicResource {
  type: "playlists" | "library-playlists";
  attributes: {
    name: string;
    description?: { standard?: string; short?: string };
    playlistType?: string;
    lastModifiedDate?: string;
    artwork?: Artwork;
    url?: string;
    canEdit?: boolean;
    isPublic?: boolean;
  };
}

export interface Recommendation extends AppleMusicResource {
  type: "personal-recommendation";
  attributes: {
    title: { stringForDisplay: string };
    reason?: { stringForDisplay: string };
    isGroupRecommendation: boolean;
    nextUpdateDate: string;
    resourceTypes: string[];
  };
  relationships: {
    contents: {
      data: AppleMusicResource[];
    };
  };
}

export interface AppleMusicResponse<
  T extends AppleMusicResource = AppleMusicResource,
> {
  data: T[];
  next?: string;
  meta?: {
    total?: number;
    results?: {
      order: string[];
    };
  };
}

export interface SearchResponse {
  results: {
    songs?: AppleMusicResponse<Song>;
    albums?: AppleMusicResponse<Album>;
    artists?: AppleMusicResponse<Artist>;
    playlists?: AppleMusicResponse<Playlist>;
  };
  meta?: {
    results: {
      order: string[];
    };
  };
}

export interface AppleMusicErrorDetail {
  id: string;
  title: string;
  detail: string;
  status: string;
  code: string;
}

export interface AppleMusicErrorResponse {
  errors: AppleMusicErrorDetail[];
}
