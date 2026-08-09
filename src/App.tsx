import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import LandingPage from './pages/LandingPage';
import NewCompetitionPage from './pages/NewCompetitionPage';
import MusicPlayer from './components/music/MusicPlayer';

const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const TeamMatchPage = lazy(() => import('./pages/TeamMatchPage'));
const ResourceHubPage = lazy(() => import('./pages/ResourceHubPage'));
const SprintRoomPage = lazy(() => import('./pages/SprintRoomPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const SpotifyCallbackPage = lazy(() => import('./pages/SpotifyCallbackPage'));

const RouteFallback = () => (
  <div className="min-h-screen bg-ink" />
);

function App() {
  const location = useLocation();

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Routes location={location}>
              <Route path="/" element={<LandingPage />} />

              <Route
                path="/workspace/:workspaceId"
                element={<WorkspacePage />}
              />

              <Route
                path="/workspace/:workspaceId/resources"
                element={<ResourceHubPage />}
              />

              <Route
                path="/sprintroom/:workspaceId"
                element={<SprintRoomPage />}
              />

              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route
                path="/newcompetition"
                element={<NewCompetitionPage />}
              />
              <Route path="/teammatch" element={<TeamMatchPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route
                path="/callback"
                element={<SpotifyCallbackPage />}
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>

      <MusicPlayer />
    </>
  );
}

export default App;