import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Plus, FolderArchive, ArrowRight, Sparkles } from 'lucide-react';
import Footer from '../components/layout/Footer';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import SettingsDrawer from '../components/dashboard/SettingsDrawer';

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const USER_NAME = 'Heshika';

const MOCK_COMPETITIONS = [
  { id: 'c1', name: 'Web Wonders 2026', stage: 'Backend Development', daysRemaining: 6 },
  { id: 'c2', name: 'Smart India Hackathon', stage: 'UI Design', daysRemaining: 21 },
  { id: 'c3', name: 'HackVerse 4.0', stage: 'AI Integration', daysRemaining: 10 },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const competitions = MOCK_COMPETITIONS;

  return (
    <div className="bg-ink min-h-screen">
      <section className="relative pt-12 md:pt-16 pb-10 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="font-display text-primary text-2xl md:text-4xl leading-tight tracking-tight mb-2">
                {getGreeting()}, {USER_NAME} 👋
              </h1>
              <p className="text-gray-500 text-sm md:text-base">Ready to build something today?</p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-primary/70 hover:text-primary transition-colors shrink-0"
              aria-label="Settings"
            >
              <Settings size={17} />
            </button>
          </div>

          {/* Start New Competition */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full text-left mb-12"
          >
            <div className="relative rounded-3xl overflow-hidden border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card px-6 py-8 md:px-10 md:py-10 hover:border-accent/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent mb-5">
                <Plus size={22} />
              </div>
              <h2 className="text-primary text-xl md:text-2xl mb-2">Start New Competition</h2>
              <p className="text-gray-400 text-sm md:text-base max-w-md">
                Create a new workspace for a hackathon, college project or competition.
              </p>
            </div>
          </motion.button>

          {/* Current Competitions */}
          {competitions.length > 0 ? (
            <div className="mb-12">
              <h2 className="text-primary text-lg mb-6">Current Competitions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitions.map((c) => (
                  <SpotlightCard
                    key={c.id}
                    className="h-full flex flex-col"
                    spotlightColor="rgba(255, 91, 46, 0.15)"
                  >
                    <h3 className="text-primary text-base mb-1.5">{c.name}</h3>
                    <p className="text-gray-500 text-xs mb-6">{c.stage}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-500">{c.daysRemaining} days left</span>
                      <button
                        onClick={() => navigate('/workspace')}
                        className="flex items-center gap-1 text-sm text-primary/80 hover:text-primary transition-colors"
                      >
                        Continue <ArrowRight size={13} />
                      </button>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-white/5 rounded-2xl text-center py-20 px-6 mb-12">
              <Sparkles size={28} className="text-gray-600 mx-auto mb-4" />
              <p className="text-primary/70 mb-1">No active competitions.</p>
              <p className="text-gray-500 text-sm mb-6">Create your first competition workspace.</p>
              <button className="text-sm bg-primary text-ink rounded-full px-6 py-2.5 font-medium hover:bg-white transition-colors">
                Start New Competition
              </button>
            </div>
          )}

          {/* Archive Navigation */}
          <button
            onClick={() => navigate('/archive')}
            className="w-full text-left bg-card border border-white/5 hover:border-white/15 rounded-2xl px-6 py-6 flex items-center justify-between gap-4 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-primary shrink-0">
                <FolderArchive size={18} />
              </div>
              <div>
                <p className="text-primary text-sm md:text-base">Competition Archive</p>
                <p className="text-gray-500 text-xs md:text-sm">
                  View your completed competitions and past projects.
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-sm text-primary/80 shrink-0">
              Open Archive <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </section>

      <Footer />

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default DashboardPage;