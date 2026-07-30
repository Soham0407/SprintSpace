export {};

declare global {
  interface Window {
    Spotify: typeof Spotify;
    onSpotifyWebPlaybackSDKReady: () => void;
  }

  namespace Spotify {
    interface PlayerInit {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }

    interface WebPlaybackTrack {
      name: string;
      artists: { name: string }[];
      album: { images: { url: string }[] };
    }

    interface WebPlaybackState {
      paused: boolean;
      position: number;
      duration: number;
      track_window: {
        current_track: WebPlaybackTrack;
      };
    }

    interface WebPlaybackError {
      message: string;
    }

    class Player {
      constructor(init: PlayerInit);
      connect(): Promise<boolean>;
      disconnect(): void;
      togglePlay(): Promise<void>;
      nextTrack(): Promise<void>;
      previousTrack(): Promise<void>;
      setVolume(volume: number): Promise<void>;
      addListener(event: 'ready' | 'not_ready', cb: (data: { device_id: string }) => void): void;
      addListener(event: 'player_state_changed', cb: (state: WebPlaybackState | null) => void): void;
      addListener(
        event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
        cb: (data: WebPlaybackError) => void,
      ): void;
    }
  }
}
