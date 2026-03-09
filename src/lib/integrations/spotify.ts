interface SpotifyArtistInfo {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  genres: string;
}

interface SpotifyTrack {
  trackName: string;
  albumName: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  spotifyUrl: string | null;
  rank: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Spotify credentials not set");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) throw new Error(`Spotify auth error: ${response.status}`);

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export function parseSpotifyArtist(raw: Record<string, unknown>): SpotifyArtistInfo {
  const images = raw.images as Array<{ url: string; width: number }> | undefined;
  const genres = raw.genres as string[] | undefined;

  return {
    spotifyId: raw.id as string,
    name: raw.name as string,
    imageUrl: images?.[0]?.url ?? null,
    genres: genres?.join(", ") ?? "",
  };
}

export function parseSpotifyTopTracks(tracks: Array<Record<string, unknown>>): SpotifyTrack[] {
  return tracks.slice(0, 5).map((track, index) => {
    const album = track.album as Record<string, unknown> | undefined;
    const albumImages = album?.images as Array<{ url: string }> | undefined;
    const externalUrls = track.external_urls as Record<string, string> | undefined;

    return {
      trackName: track.name as string,
      albumName: (album?.name as string) ?? null,
      albumArtUrl: albumImages?.[0]?.url ?? null,
      previewUrl: (track.preview_url as string) ?? null,
      spotifyUrl: externalUrls?.spotify ?? null,
      rank: index + 1,
    };
  });
}

export async function searchArtist(artistName: string): Promise<SpotifyArtistInfo | null> {
  const token = await getSpotifyToken();

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", artistName);
  url.searchParams.set("type", "artist");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const artist = data.artists?.items?.[0];
  if (!artist) return null;

  return parseSpotifyArtist(artist);
}

export async function getTopTracks(spotifyId: string): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/artists/${spotifyId}/top-tracks`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return parseSpotifyTopTracks(data.tracks ?? []);
}
