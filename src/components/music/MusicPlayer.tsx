import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Music2, Search, Play, Pause, SkipBack, SkipForward, X, Loader2, AlertCircle } from 'lucide-react';
import {
  redirectToSpotifyLogin,
  getStoredTokens,
  hasSpotifyClientId,
  clearSpotifySession,
} from '../../lib/spotifyAuth';
import { searchTracks, playOnDevice, type SpotifyTrack } from '../../lib/spotifyApi';
import { useSpotifyPlayer } from '../../hooks/useSpotifyPlayer';

const MusicPlayer = () => {
  const location = useLocation();
  const [connected, setConnected] = useState(() => Boolean(getStoredTokens()));
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<number | undefined>(undefined);

  const player = useSpotifyPlayer(connected);

  // The Spotify login is a full-page redirect; on the way back the
  // /callback route does a client-side navigate() to "/", which re-runs
  // this — that's how we notice new tokens without a page reload.
  useEffect(() => {
    setConnected(Boolean(getStoredTokens()));
  }, [location.pathname]);

  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = window.setTimeout(async () => {
      try {
        setResults(await searchTracks(query));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, [query]);

  const handleDisconnect = () => {
    clearSpotifySession();
    setConnected(false);
    setExpanded(false);
  };

  const handlePlay = async (track: SpotifyTrack) => {
    if (!player.deviceId) return;
    try {
      await playOnDevice(player.deviceId, [track.uri]);
      setQuery('');
      setResults([]);
    } catch (e) {
      console.error(e);
    }
  };

  // No Client ID configured yet — stay invisible rather than show a
  // half-working feature.
  if (!hasSpotifyClientId()) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[200]">
      {!connected && (
        <button
          onClick={() => redirectToSpotifyLogin().catch(console.error)}
          className="flex items-center gap-2 bg-card border border-white/10 hover:border-white/20 text-primary/80 hover:text-primary text-xs px-4 py-2.5 rounded-full backdrop-blur transition-colors"
        >
          <Music2 size={14} />
          Connect Spotify
        </button>
      )}

      {connected && (
        <div className="relative">
          {expanded && (
            <div className="absolute bottom-16 left-0 w-72 bg-card border border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">Spotify</span>
                <button onClick={handleDisconnect} className="text-gray-600 hover:text-gray-400">
                  <X size={14} />
                </button>
              </div>

              {player.error && (
                <p className="text-[11px] text-red-400 mb-3 flex items-start gap-1.5">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" /> {player.error}
                </p>
              )}

              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a song..."
                  className="w-full bg-surface border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-primary placeholder-gray-600 focus:outline-none focus:border-accent"
                />
              </div>

              {searching && <Loader2 size={14} className="animate-spin text-gray-600 mx-auto my-2 block" />}

              {results.length > 0 && (
                <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
                  {results.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handlePlay(t)}
                      className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 text-left"
                    >
                      {t.albumArt ? (
                        <img src={t.albumArt} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-surface shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-primary truncate">{t.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{t.artists}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {player.currentTrack && (
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center gap-3 mb-3">
                    {player.currentTrack.albumArt ? (
                      <img
                        src={player.currentTrack.albumArt}
                        alt=""
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-surface shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-primary truncate">{player.currentTrack.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{player.currentTrack.artists}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={player.previousTrack} className="text-gray-400 hover:text-primary">
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={player.togglePlay}
                      className="w-8 h-8 rounded-full bg-primary text-ink flex items-center justify-center"
                    >
                      {player.isPaused ? <Play size={14} className="ml-0.5" /> : <Pause size={14} />}
                    </button>
                    <button onClick={player.nextTrack} className="text-gray-400 hover:text-primary">
                      <SkipForward size={16} />
                    </button>
                  </div>
                </div>
              )}

              {!player.ready && !player.error && (
                <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" /> Setting up player device...
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-14 h-14 rounded-full bg-card border border-white/10 hover:border-white/20 flex items-center justify-center overflow-hidden shadow-xl transition-colors relative"
          >
            {player.currentTrack?.albumArt ? (
              <img
                src={player.currentTrack.albumArt}
                alt=""
                className={`w-full h-full object-cover ${
                  !player.isPaused ? 'animate-[spin_8s_linear_infinite]' : ''
                }`}
              />
            ) : (
              <Music2 size={18} className="text-primary/60" />
            )}
            {!player.isPaused && player.currentTrack && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-ink" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
