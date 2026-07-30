import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { exchangeCodeForTokens } from '../lib/spotifyAuth';

const SpotifyCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return; // StrictMode double-invoke guard — code exchange is one-shot
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errParam = params.get('error');

    if (errParam) {
      setError(errParam === 'access_denied' ? 'Spotify login was cancelled.' : errParam);
      return;
    }
    if (!code) {
      setError('No authorization code in the redirect — try connecting again.');
      return;
    }

    exchangeCodeForTokens(code)
      .then(() => navigate('/', { replace: true }))
      .catch((e: Error) => setError(e.message));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-primary mb-2">Couldn&apos;t connect to Spotify</p>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-accent hover:underline"
            >
              Back to SprintSpace
            </button>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin mx-auto mb-4 text-accent" size={28} />
            <p className="text-gray-400 text-sm">Connecting to Spotify...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SpotifyCallbackPage;
