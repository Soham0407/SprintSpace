import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MusicPlayer from './components/music/MusicPlayer';

const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const TeamMatchPage = lazy(() => import('./pages/TeamMatchPage'));
const ResourceHubPage = lazy(() => import('./pages/ResourceHubPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const SpotifyCallbackPage = lazy(() => import('./pages/SpotifyCallbackPage'));

const RouteFallback = () => <div className="min-h-screen bg-ink" />;

function App() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/teammatch" element={<TeamMatchPage />} />
          <Route path="/resources" element={<ResourceHubPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/callback" element={<SpotifyCallbackPage />} />
        </Routes>
      </Suspense>
      <MusicPlayer />
    </>
  );
}

export default App;
