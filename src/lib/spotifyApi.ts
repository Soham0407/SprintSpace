import { getValidAccessToken } from './spotifyAuth';

export interface SpotifyTrack {
  uri: string;
  id: string;
  name: string;
  artists: string;
  albumArt: string | null;
  durationMs: number;
}

function mapTrack(raw: {
  uri: string;
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  duration_ms: number;
}): SpotifyTrack {
  return {
    uri: raw.uri,
    id: raw.id,
    name: raw.name,
    artists: raw.artists.map((a) => a.name).join(', '),
    albumArt: raw.album.images[raw.album.images.length - 1]?.url ?? raw.album.images[0]?.url ?? null,
    durationMs: raw.duration_ms,
  };
}

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  const token = await getValidAccessToken();
  if (!token || !query.trim()) return [];

  const params = new URLSearchParams({ q: query, type: 'track', limit: '8' });
  const res = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify search failed: ${res.status}`);
  const data = await res.json();
  return (data.tracks?.items ?? []).map(mapTrack);
}

/** Starts playback of `uris` on the given Web Playback SDK device. */
export async function playOnDevice(deviceId: string, uris: string[]) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not connected to Spotify');
  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris }),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Playback failed: ${res.status}`);
}
