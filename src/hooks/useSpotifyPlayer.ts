import { useEffect, useRef, useState } from 'react';
import { getValidAccessToken } from '../lib/spotifyAuth';

export interface PlayerTrack {
  name: string;
  artists: string;
  albumArt: string | null;
  durationMs: number;
}

interface SpotifyPlayerState {
  ready: boolean;
  deviceId: string | null;
  currentTrack: PlayerTrack | null;
  isPaused: boolean;
  positionMs: number;
  error: string | null;
}

const SDK_SCRIPT_ID = 'spotify-player-sdk';

function loadSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    if (document.getElementById(SDK_SCRIPT_ID)) return;
    const script = document.createElement('script');
    script.id = SDK_SCRIPT_ID;
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
  });
}

/** Loads and drives the Spotify Web Playback SDK once `connected` is true.
    Requires Spotify Premium — Spotify's own platform restriction, not
    something this code can work around. */
export function useSpotifyPlayer(connected: boolean) {
  const playerRef = useRef<Spotify.Player | null>(null);
  const [state, setState] = useState<SpotifyPlayerState>({
    ready: false,
    deviceId: null,
    currentTrack: null,
    isPaused: true,
    positionMs: 0,
    error: null,
  });

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;

    loadSdk().then(async () => {
      if (cancelled) return;

      const player = new window.Spotify.Player({
        name: 'SprintSpace Web Player',
        getOAuthToken: async (cb) => {
          const token = await getValidAccessToken();
          if (token) cb(token);
        },
        volume: 0.6,
      });

      player.addListener('ready', ({ device_id }) => {
        setState((s) => ({ ...s, ready: true, deviceId: device_id, error: null }));
      });
      player.addListener('not_ready', () => {
        setState((s) => ({ ...s, ready: false }));
      });
      player.addListener('player_state_changed', (playbackState) => {
        if (!playbackState) return;
        const track = playbackState.track_window.current_track;
        setState((s) => ({
          ...s,
          currentTrack: {
            name: track.name,
            artists: track.artists.map((a) => a.name).join(', '),
            albumArt: track.album.images[0]?.url ?? null,
            durationMs: playbackState.duration,
          },
          isPaused: playbackState.paused,
          positionMs: playbackState.position,
        }));
      });
      player.addListener('initialization_error', ({ message }) => {
        setState((s) => ({ ...s, error: message }));
      });
      player.addListener('authentication_error', ({ message }) => {
        setState((s) => ({ ...s, error: message }));
      });
      player.addListener('account_error', () => {
        setState((s) => ({
          ...s,
          error: 'This needs a Spotify Premium account — the Web Playback SDK requires it.',
        }));
      });

      playerRef.current = player;
      await player.connect();
    });

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [connected]);

  return {
    ...state,
    togglePlay: () => playerRef.current?.togglePlay(),
    nextTrack: () => playerRef.current?.nextTrack(),
    previousTrack: () => playerRef.current?.previousTrack(),
  };
}
