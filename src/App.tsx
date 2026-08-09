import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import NewCompetitionPage from "./pages/NewCompetitionPage";
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

const RouteFallback = () => <div className="min-h-screen bg-ink" />;

const singularityVariants = {
  initial: { clipPath: 'circle(0% at 50% 50%)' },
  animate: {
    clipPath: 'circle(150% at 50% 50%)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    clipPath: 'circle(0% at 50% 50%)',
    transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] as const },
  },
};

const flashVariants = {
  initial: { opacity: 0, scale: 0.2 },
  animate: {
    opacity: [0, 0.9, 0],
    scale: [0.2, 1.4, 2.2],
    transition: { duration: 0.55, ease: 'easeOut' as const, times: [0, 0.35, 1] },
  },
  exit: { opacity: 0 },
};

function App() {
  const location = useLocation();

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={singularityVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ position: 'relative', minHeight: '100vh', background: '#0A0A0A' }}
          >
            <Routes location={location}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/newcompetition" element={<NewCompetitionPage />} />
              <Route path="/teammatch" element={<TeamMatchPage />} />
              <Route path="/resources" element={<ResourceHubPage />} />
              <Route path="/sprintroom" element={<SprintRoomPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/callback" element={<SpotifyCallbackPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          <motion.div
            key={`flash-${location.pathname}`}
            variants={flashVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '4px',
              height: '4px',
              marginLeft: '-2px',
              marginTop: '-2px',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, rgba(255,91,46,0.9) 0%, rgba(255,91,46,0) 70%)',
              boxShadow: '0 0 60px 20px rgba(255,91,46,0.5)',
              pointerEvents: 'none',
              zIndex: 99999,
            }}
          />
        </AnimatePresence>
      </Suspense>
      <MusicPlayer />
    </>
  );
}

export default App;